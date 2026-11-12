package fit.iuh.foodgobackend.communication;

import fit.iuh.foodgobackend.account.UserPrincipal;
import fit.iuh.foodgobackend.ordering.OrderPolicy;
import fit.iuh.foodgobackend.ordering.OrderRepository;
import jakarta.validation.constraints.*;
import java.math.BigInteger;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static fit.iuh.foodgobackend.common.Data.*;

@Service
public class CommunicationService {
 private final OrderRepository orders;
 private final CommunicationRepository repository;
 private final String callScenario;
 private static final Set<String> REVIEW_TAGS=Set.of("SERVICE","FRIENDLY","DELIVERY");
 public record MessageInput(@NotBlank String clientMessageId,@NotBlank String kind,@Size(max=1000) String text,String assetCode){}
 // Number preserves JSON decimals so they can be rejected instead of silently truncated.
 public record ReviewInput(@NotNull Number stars,@NotNull @Size(max=3) List<@NotBlank String> tags,@Size(max=300) String note){}
 public CommunicationService(OrderRepository orders,CommunicationRepository repository,@Value("${foodgo.call-scenario:CONNECTED}") String callScenario){this.orders=orders;this.repository=repository;require(Set.of("CONNECTED","NO_ANSWER","FAILED").contains(callScenario),500,"INVALID_CALL_SCENARIO","Cấu hình cuộc gọi không hợp lệ.");this.callScenario=callScenario;}

 private Map<String,Object> participant(UserPrincipal user,long orderId,boolean lock){
  require(Set.of("CUSTOMER","DRIVER").contains(user.role()),403,"FORBIDDEN","Chỉ khách hàng và tài xế được tham gia hội thoại.");
  var order=orders.visible(user,orderId,lock);
  require((user.role().equals("CUSTOMER")&&n(order,"customer_id")==user.id())||(user.role().equals("DRIVER")&&n(order,"driver_id")==user.id()),404,"NOT_FOUND","Không tìm thấy đơn trong phạm vi tài khoản.");
  require(order.get("driver_id")!=null,409,"CONVERSATION_UNAVAILABLE","Hội thoại chỉ mở sau khi có tài xế nhận đơn.");
  return order;
 }
 private static void active(Map<String,Object> order){require(!OrderPolicy.terminal(s(order,"status")),409,"MESSAGE_READ_ONLY","Đơn đã kết thúc; chỉ có thể xem tin nhắn cũ.");}
 @Transactional(readOnly=true)
 public Map<String,Object> conversation(UserPrincipal user,long orderId){var order=participant(user,orderId,false);return m("id",Long.toString(orderId),"orderId",Long.toString(orderId),"readOnly",OrderPolicy.terminal(s(order,"status")),"participants",repository.participants(n(order,"customer_id"),n(order,"driver_id")));}
 @Transactional(readOnly=true)
 public List<Map<String,Object>> messages(UserPrincipal user,long orderId,int limit,Long beforeId,Long afterId){
  require(limit>=1&&limit<=50,400,"INVALID_PAGE","Giới hạn tin nhắn phải từ 1 đến 50.");
  require((beforeId==null||beforeId>0)&&(afterId==null||afterId>=0)&&!(beforeId!=null&&afterId!=null),400,"INVALID_CURSOR","Chỉ dùng một cursor tin nhắn hợp lệ.");
  participant(user,orderId,false);return repository.messages(orderId,limit,beforeId,afterId).stream().map(CommunicationService::messageDto).toList();
 }
 @Transactional
 public Map<String,Object> send(UserPrincipal user,long orderId,MessageInput input){
  require(input!=null,400,"INVALID_MESSAGE","Tin nhắn không hợp lệ.");String key=uuid(input.clientMessageId());
  var order=participant(user,orderId,true);
  repository.lockSender(user.id());
  var old=repository.existingMessage(user.id(),key);
  if(old!=null){require(n(old,"order_id")==orderId&&s(old,"kind").equals(input.kind())&&Objects.equals(old.get("text"),input.text())&&Objects.equals(old.get("asset_code"),input.assetCode()),409,"MESSAGE_KEY_CONFLICT","Mã tin nhắn đã được dùng cho nội dung khác.");return messageDto(old);}
  boolean text="TEXT".equals(input.kind())&&input.text()!=null&&!input.text().isBlank()&&input.text().length()<=1000&&input.assetCode()==null;
  boolean image="IMAGE".equals(input.kind())&&input.text()==null&&"MEAL_SAMPLE".equals(input.assetCode());
  require(text||image,400,"INVALID_MESSAGE","Tin nhắn phải có nội dung 1–1.000 ký tự hoặc ảnh mẫu được cho phép.");
  active(order);return messageDto(repository.insertMessage(orderId,user.id(),key,input.kind(),input.text(),input.assetCode()));
 }
 @Transactional(readOnly=true)
 public Map<String,Object> call(UserPrincipal user,long orderId){active(participant(user,orderId,false));return m("orderId",Long.toString(orderId),"allowed",true,"simulated",true,"scenarioCode",callScenario);}
 private Map<String,Object> reviewable(UserPrincipal user,long orderId,boolean lock){
  user.requireRole("CUSTOMER");var order=orders.visible(user,orderId,lock);
  require(n(order,"customer_id")==user.id(),404,"NOT_FOUND","Không tìm thấy đơn trong phạm vi tài khoản.");
  require("DELIVERED".equals(s(order,"status"))&&order.get("driver_id")!=null,409,"REVIEW_NOT_ALLOWED","Chỉ đánh giá tài xế sau khi giao thành công.");return order;
 }
 @Transactional(readOnly=true)
 public Map<String,Object> review(UserPrincipal user,long orderId){reviewable(user,orderId,false);var old=repository.review(orderId);require(old!=null,404,"NOT_FOUND","Đơn chưa có đánh giá tài xế.");return reviewDto(old);}
 @Transactional
 public Map<String,Object> sendReview(UserPrincipal user,long orderId,ReviewInput input){
  require(input!=null&&input.stars()!=null&&input.tags()!=null,400,"INVALID_REVIEW","Đánh giá không hợp lệ.");
  var stars=input.stars();boolean integral=stars instanceof Integer||stars instanceof Long||stars instanceof Short||stars instanceof Byte||stars instanceof BigInteger;
  require(integral&&new BigInteger(stars.toString()).compareTo(BigInteger.ONE)>=0&&new BigInteger(stars.toString()).compareTo(BigInteger.valueOf(5))<=0,400,"INVALID_REVIEW","Số sao phải là số nguyên từ 1 đến 5.");
  require(input.tags().stream().allMatch(t->t!=null&&REVIEW_TAGS.contains(t))&&new HashSet<>(input.tags()).size()==input.tags().size(),400,"INVALID_REVIEW","Nhãn đánh giá không hợp lệ hoặc bị lặp.");
  String note=input.note()==null?"":input.note();require(note.length()<=300,400,"INVALID_REVIEW","Ghi chú tối đa 300 ký tự.");
  var tags=input.tags().stream().sorted().toList();var order=reviewable(user,orderId,true);var old=repository.review(orderId);
  if(old!=null){require(n(old,"stars")==stars.intValue()&&new HashSet<>(strings(old.get("tags_json"))).equals(new HashSet<>(tags))&&s(old,"note").equals(note),409,"REVIEW_ALREADY_EXISTS","Đơn đã có đánh giá với nội dung khác.");return reviewDto(old);}
  return reviewDto(repository.insertReview(orderId,user.id(),n(order,"driver_id"),stars.intValue(),tags,note));
 }
 private static Map<String,Object> messageDto(Map<String,Object> row){return m("id",id(row.get("id")),"senderId",id(row.get("sender_id")),"senderName",row.get("sender_name"),"clientMessageId",row.get("client_message_id"),"kind",row.get("kind"),"text",row.get("text"),"assetCode",row.get("asset_code"),"isSimulated",bool(row.get("is_simulated")),"createdAt",iso(row.get("created_at")));}
 private static Map<String,Object> reviewDto(Map<String,Object> row){return m("id",id(row.get("id")),"orderId",id(row.get("order_id")),"stars",n(row,"stars"),"tags",strings(row.get("tags_json")),"note",row.get("note"),"createdAt",iso(row.get("created_at")));}
}

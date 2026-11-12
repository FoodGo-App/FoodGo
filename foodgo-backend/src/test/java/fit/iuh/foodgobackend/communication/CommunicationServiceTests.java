package fit.iuh.foodgobackend.communication;

import fit.iuh.foodgobackend.account.UserPrincipal;
import fit.iuh.foodgobackend.common.ApiException;
import fit.iuh.foodgobackend.ordering.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.sql.Timestamp;
import java.util.*;
import static fit.iuh.foodgobackend.common.Data.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CommunicationServiceTests {
 private final UserPrincipal customer=new UserPrincipal(1,"Customer","CUSTOMER",null,"");
 private final UserPrincipal driver=new UserPrincipal(2,"Driver","DRIVER",null,"");
 private final OrderRepository orders=mock(OrderRepository.class);
 private final CommunicationRepository repository=mock(CommunicationRepository.class);
 private CommunicationService service;
 private final String key="00000000-0000-4000-8000-000000000001";
 private Map<String,Object> order;
 @BeforeEach void setup(){service=new CommunicationService(orders,repository,"CONNECTED");order=m("id",10L,"customer_id",1L,"driver_id",2L,"status","OUT_FOR_DELIVERY");when(orders.visible(any(),eq(10L),anyBoolean())).thenReturn(order);when(repository.existingMessage(anyLong(),anyString())).thenReturn(null);when(repository.review(anyLong())).thenReturn(null);}
 private CommunicationService.MessageInput text(String value){return new CommunicationService.MessageInput(key,"TEXT",value,null);}
 private Map<String,Object> message(){return m("id",30L,"order_id",10L,"sender_id",1L,"sender_name","Customer","client_message_id",key,"kind","TEXT","text","Hello","asset_code",null,"is_simulated",false,"created_at",Timestamp.valueOf("2026-11-11 10:00:00"));}
 private void code(String expected,Runnable action){assertEquals(expected,assertThrows(ApiException.class,action::run).code);}

 @Test void conversationUsesOrderIdAndActualParticipants(){when(repository.participants(1,2)).thenReturn(List.of(m("id","1","displayName","Customer"),m("id","2","displayName","Driver")));var dto=service.conversation(customer,10);assertEquals("10",dto.get("id"));assertEquals(false,dto.get("readOnly"));assertEquals(2,((List<?>)dto.get("participants")).size());order.put("status","DELIVERED");assertEquals(true,service.conversation(customer,10).get("readOnly"));}
 @Test void restaurantCannotReadConversation(){var restaurant=new UserPrincipal(3,"Restaurant","RESTAURANT",7L,"");code("FORBIDDEN",()->service.conversation(restaurant,10));verifyNoInteractions(repository);}
 @Test void conversationNeedsAssignedDriver(){order.put("driver_id",null);code("CONVERSATION_UNAVAILABLE",()->service.conversation(customer,10));}
 @Test void unrelatedCustomerIsHidden(){code("NOT_FOUND",()->service.conversation(new UserPrincipal(99,"Other","CUSTOMER",null,""),10));}
 @Test void matchingRetryReturnsOldMessageAfterTerminal(){order.put("status","DELIVERED");when(repository.existingMessage(1,key)).thenReturn(message());assertEquals("30",service.send(customer,10,text("Hello")).get("id"));verify(repository,never()).insertMessage(anyLong(),anyLong(),any(),any(),any(),any());}
 @Test void conflictingRetryRejectsBeforeTerminal(){order.put("status","DELIVERED");when(repository.existingMessage(1,key)).thenReturn(message());code("MESSAGE_KEY_CONFLICT",()->service.send(customer,10,text("Changed")));}
 @Test void keyConflictWinsOverMalformedReplacement(){when(repository.existingMessage(1,key)).thenReturn(message());code("MESSAGE_KEY_CONFLICT",()->service.send(customer,10,text("")));}
 @Test void senderKeyCannotBeReusedAcrossOrders(){var old=message();old.put("order_id",11L);when(repository.existingMessage(1,key)).thenReturn(old);code("MESSAGE_KEY_CONFLICT",()->service.send(customer,10,text("Hello")));}
 @Test void freshTerminalMessageCannotBeInserted(){order.put("status","CANCELLED");code("MESSAGE_READ_ONLY",()->service.send(customer,10,text("Hello")));verify(repository,never()).insertMessage(anyLong(),anyLong(),any(),any(),any(),any());}
 @Test void newMessageDerivesSenderAndLocksBeforeInsert(){when(repository.insertMessage(10,1,key,"TEXT","Hello",null)).thenReturn(message());assertEquals("1",service.send(customer,10,text("Hello")).get("senderId"));var sequence=inOrder(orders,repository);sequence.verify(orders).visible(customer,10,true);sequence.verify(repository).lockSender(1);sequence.verify(repository).existingMessage(1,key);sequence.verify(repository).insertMessage(10,1,key,"TEXT","Hello",null);}
 @Test void messageRejectsConflictingShapeAndUntrustedImages(){code("INVALID_MESSAGE",()->service.send(customer,10,new CommunicationService.MessageInput(key,"TEXT","Hello","MEAL_SAMPLE")));code("INVALID_MESSAGE",()->service.send(customer,10,new CommunicationService.MessageInput(key,"IMAGE",null,"https://example.test/a.png")));code("INVALID_MESSAGE",()->service.send(customer,10,text(" ")));code("INVALID_MESSAGE",()->service.send(customer,10,text("a".repeat(1001))));code("INVALID_REQUEST_KEY",()->service.send(customer,10,new CommunicationService.MessageInput("bad","TEXT","Hello",null)));}
 @Test void senderFieldsAreIgnoredOnTheWire(){var json="{\"clientMessageId\":\""+key+"\",\"kind\":\"TEXT\",\"text\":\"Hello\",\"senderId\":\"99\",\"isSimulated\":true}";var input=tools.jackson.databind.json.JsonMapper.builder().build().readValue(json,CommunicationService.MessageInput.class);when(repository.insertMessage(10,1,key,"TEXT","Hello",null)).thenReturn(message());var result=service.send(customer,10,input);assertEquals("1",result.get("senderId"));assertEquals(false,result.get("isSimulated"));}
 @Test void imageAllowlistMessageKeepsServerSender(){var image=message();image.put("kind","IMAGE");image.put("text",null);image.put("asset_code","MEAL_SAMPLE");image.put("sender_id",2L);when(repository.insertMessage(10,2,key,"IMAGE",null,"MEAL_SAMPLE")).thenReturn(image);var result=service.send(driver,10,new CommunicationService.MessageInput(key,"IMAGE",null,"MEAL_SAMPLE"));assertEquals("MEAL_SAMPLE",result.get("assetCode"));assertEquals("2",result.get("senderId"));}
 @Test void messagesRejectBothCursorsAndLargeLimit(){code("INVALID_CURSOR",()->service.messages(customer,10,20,10L,20L));code("INVALID_PAGE",()->service.messages(customer,10,51,null,null));code("INVALID_CURSOR",()->service.messages(customer,10,20,-1L,null));}
 @Test void messagesUseDefaultLastTwenty(){when(repository.messages(10,20,null,null)).thenReturn(List.of(message()));assertEquals("30",service.messages(customer,10,20,null,null).getFirst().get("id"));}
 @Test void activeParticipantCallReturnsConfiguredSimulation(){assertEquals(m("orderId","10","allowed",true,"simulated",true,"scenarioCode","NO_ANSWER"),new CommunicationService(orders,repository,"NO_ANSWER").call(driver,10));order.put("status","DELIVERED");code("MESSAGE_READ_ONLY",()->service.call(driver,10));}
 @Test void reviewOnlyDeliveredOwner(){var input=new CommunicationService.ReviewInput(5,List.of("SERVICE"),"Good");code("REVIEW_NOT_ALLOWED",()->service.sendReview(customer,10,input));order.put("status","DELIVERED");code("FORBIDDEN",()->service.sendReview(driver,10,input));}
 @Test void reviewValidatesTagsStarsAndNote(){order.put("status","DELIVERED");code("INVALID_REVIEW",()->service.sendReview(customer,10,new CommunicationService.ReviewInput(6,List.of(),"")));code("INVALID_REVIEW",()->service.sendReview(customer,10,new CommunicationService.ReviewInput(5,List.of("UNKNOWN"),"")));code("INVALID_REVIEW",()->service.sendReview(customer,10,new CommunicationService.ReviewInput(5,List.of("SERVICE","SERVICE"),"")));code("INVALID_REVIEW",()->service.sendReview(customer,10,new CommunicationService.ReviewInput(5,List.of(),"x".repeat(301))));}
 @Test void reviewRejectsDecimalAndOverflowedStars(){order.put("status","DELIVERED");code("INVALID_REVIEW",()->service.sendReview(customer,10,new CommunicationService.ReviewInput(4.5,List.of(),"")));code("INVALID_REVIEW",()->service.sendReview(customer,10,new CommunicationService.ReviewInput(new java.math.BigInteger("18446744073709551621"),List.of(),"")));}
 @Test void reviewRetryIsStableAndTagsAreASet(){order.put("status","DELIVERED");var old=m("id",80L,"order_id",10L,"stars",5,"tags_json","[\"SERVICE\",\"FRIENDLY\"]","note","Good","created_at",Timestamp.valueOf("2026-11-11 10:00:00"));when(repository.review(10)).thenReturn(old);assertEquals("80",service.sendReview(customer,10,new CommunicationService.ReviewInput(5,List.of("FRIENDLY","SERVICE"),"Good")).get("id"));code("REVIEW_ALREADY_EXISTS",()->service.sendReview(customer,10,new CommunicationService.ReviewInput(4,List.of("SERVICE","FRIENDLY"),"Good")));verify(repository,never()).insertReview(anyLong(),anyLong(),anyLong(),anyInt(),anyList(),anyString());}
 @Test void reviewDerivesDriverFromOrder(){order.put("status","DELIVERED");when(repository.insertReview(10,1,2,5,List.of("SERVICE"),"Good")).thenReturn(m("id",80L,"order_id",10L,"stars",5,"tags_json","[\"SERVICE\"]","note","Good","created_at",Timestamp.valueOf("2026-11-11 10:00:00")));assertEquals("80",service.sendReview(customer,10,new CommunicationService.ReviewInput(5,List.of("SERVICE"),"Good")).get("id"));verify(orders).visible(customer,10,true);}
}

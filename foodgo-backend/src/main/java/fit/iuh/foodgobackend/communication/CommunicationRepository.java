package fit.iuh.foodgobackend.communication;

import fit.iuh.foodgobackend.common.JpaSql;
import java.util.*;
import org.springframework.stereotype.Repository;
import static fit.iuh.foodgobackend.common.Data.*;

@Repository
public class CommunicationRepository {
 private final JpaSql db;
 private static final String MESSAGE_SELECT="SELECT m.*,u.display_name AS sender_name FROM messages m JOIN users u ON u.id=m.sender_id ";
 public CommunicationRepository(JpaSql db){this.db=db;}
 public List<Map<String,Object>> participants(long customer,long driver){return db.rows("SELECT id,display_name FROM users WHERE id IN (?,?) ORDER BY id",customer,driver).stream().map(u->m("id",id(u.get("id")),"displayName",u.get("display_name"))).toList();}
 /** Serialize the globally unique sender/client key even when two orders are involved. */
 public void lockSender(long sender){db.required("SELECT id FROM users WHERE id=? FOR UPDATE",sender);}
 public Map<String,Object> existingMessage(long sender,String key){return db.one(MESSAGE_SELECT+"WHERE m.sender_id=? AND m.client_message_id=? FOR UPDATE",sender,key);}
 public Map<String,Object> insertMessage(long order,long sender,String key,String kind,String text,String asset){long id=db.insert("messages",m("order_id",order,"sender_id",sender,"client_message_id",key,"kind",kind,"text",text,"asset_code",asset,"is_simulated",false));return db.required(MESSAGE_SELECT+"WHERE m.id=?",id);}
 public List<Map<String,Object>> messages(long order,int limit,Long before,Long after){
  List<Map<String,Object>> rows;
  if(after!=null)return db.rows(MESSAGE_SELECT+"WHERE m.order_id=? AND m.id>? ORDER BY m.id ASC LIMIT ?",order,after,limit);
  if(before!=null)rows=db.rows(MESSAGE_SELECT+"WHERE m.order_id=? AND m.id<? ORDER BY m.id DESC LIMIT ?",order,before,limit);
  else rows=db.rows(MESSAGE_SELECT+"WHERE m.order_id=? ORDER BY m.id DESC LIMIT ?",order,limit);
  var ascending=new ArrayList<>(rows);Collections.reverse(ascending);return ascending;
 }
 public Map<String,Object> review(long order){return db.one("SELECT * FROM driver_reviews WHERE order_id=?",order);}
 public Map<String,Object> insertReview(long order,long customer,long driver,int stars,List<String> tags,String note){long id=db.insert("driver_reviews",m("order_id",order,"customer_id",customer,"driver_id",driver,"stars",stars,"tags_json",json(tags),"note",note));return db.required("SELECT * FROM driver_reviews WHERE id=?",id);}
}

package fit.iuh.foodgobackend.common;
import jakarta.persistence.*;
import org.springframework.stereotype.Repository;
import java.util.*;

/** Infrastructure only. Feature repositories own their business queries. */
@Repository
public class JpaSql {
 @PersistenceContext private EntityManager em;
 private Query query(String sql,Object... args){var numbered=new StringBuilder();int p=0;for(char c:sql.toCharArray()){if(c=='?')numbered.append('?').append(++p);else numbered.append(c);}var q=em.createNativeQuery(numbered.toString(),Tuple.class);for(int i=0;i<args.length;i++)q.setParameter(i+1,args[i]);return q;}
 @SuppressWarnings("unchecked") public List<Map<String,Object>> rows(String sql,Object... args){List<Tuple> list=query(sql,args).getResultList();var result=new ArrayList<Map<String,Object>>();for(var t:list){var row=new LinkedHashMap<String,Object>();for(var e:t.getElements())row.put(e.getAlias().toLowerCase(Locale.ROOT),t.get(e));result.add(row);}return result;}
 public Map<String,Object> one(String sql,Object... args){var list=rows(sql,args);return list.isEmpty()?null:list.getFirst();}
 public Map<String,Object> required(String sql,Object... args){var row=one(sql,args);if(row==null)throw new ApiException(404,"NOT_FOUND","Không tìm thấy dữ liệu trong phạm vi tài khoản.");return row;}
 public int update(String sql,Object... args){return query(sql,args).executeUpdate();}
 public long insert(String table,Map<String,Object> values){String columns=String.join(",",values.keySet());update("INSERT INTO "+table+" ("+columns+") VALUES ("+String.join(",",Collections.nCopies(values.size(),"?"))+")",values.values().toArray());return Data.n(one("SELECT LAST_INSERT_ID() AS id"),"id");}
}

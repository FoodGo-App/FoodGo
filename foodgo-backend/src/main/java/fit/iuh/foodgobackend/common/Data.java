package fit.iuh.foodgobackend.common;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.core.type.TypeReference;

public final class Data {
 private static final JsonMapper JSON=JsonMapper.builder().build();
 private Data(){}
 public static Map<String,Object> m(Object... pairs){var m=new LinkedHashMap<String,Object>();for(int i=0;i<pairs.length;i+=2)m.put((String)pairs[i],pairs[i+1]);return m;}
 public static String s(Object v){return v==null?"":v.toString();}
 public static long n(Object v){return v==null?0:v instanceof Number x?x.longValue():Long.parseLong(v.toString());}
 public static long n(Map<String,Object> m,String k){return n(m.get(k));}
 public static String s(Map<String,Object> m,String k){return s(m.get(k));}
 public static boolean bool(Object v){return v instanceof Boolean b?b:n(v)!=0;}
 public static String id(Object v){return v==null?null:s(v);}
 public static Timestamp now(){return Timestamp.from(Instant.now());}
 public static Instant instant(Object v){return v instanceof Timestamp t?t.toInstant():v instanceof java.time.LocalDateTime l?l.toInstant(java.time.ZoneOffset.UTC):Instant.parse(s(v));}
 public static String iso(Object v){return v==null?null:instant(v).toString();}
 public static String json(Object v){return JSON.writeValueAsString(v);}
 public static Map<String,Object> object(Object v){return JSON.readValue(s(v),new TypeReference<Map<String,Object>>(){});}
 public static List<Map<String,Object>> objects(Object v){return JSON.readValue(s(v),new TypeReference<List<Map<String,Object>>>(){});}
 public static List<String> strings(Object v){return JSON.readValue(s(v),new TypeReference<List<String>>(){});}
 public static String hash(String v){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(v.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
 public static void require(boolean ok,int status,String code,String message){if(!ok)throw new ApiException(status,code,message);}
 public static String uuid(String value){try{var u=UUID.fromString(value);require(u.toString().equalsIgnoreCase(value),400,"INVALID_REQUEST_KEY","Mã yêu cầu phải là UUID.");return u.toString();}catch(IllegalArgumentException|NullPointerException e){throw new ApiException(400,"INVALID_REQUEST_KEY","Mã yêu cầu phải là UUID.");}}
}

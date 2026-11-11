package fit.iuh.foodgobackend.ordering;
import static fit.iuh.foodgobackend.common.Data.require;
import java.util.Set;
public final class OrderPolicy {
 private OrderPolicy(){}
 public static boolean terminal(String status){return Set.of("DELIVERED","CANCELLED","REJECTED").contains(status);}
 public static void state(boolean value){require(value,409,"ORDER_STATE_CONFLICT","Đơn đã chuyển trạng thái; hãy tải lại.");}
 public static void cod(String method,boolean collected){require(method.equals("COD")==collected,400,method.equals("COD")?"COD_CONFIRMATION_REQUIRED":"COD_NOT_ALLOWED",method.equals("COD")?"Cần xác nhận thu đủ COD.":"Đơn ví không thu tiền mặt.");}
}

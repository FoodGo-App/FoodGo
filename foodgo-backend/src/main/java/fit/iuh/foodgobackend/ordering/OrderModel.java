package fit.iuh.foodgobackend.ordering;
import jakarta.persistence.*;
/** Minimal mapped aggregate; repository native projections include the immutable snapshots. */
@Entity @Table(name="orders") public class OrderModel {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false) private String status;
 @Column(nullable=false) private long total;
 @Version private long version;
 protected OrderModel(){}
 public Long getId(){return id;}public String getStatus(){return status;}public long getTotal(){return total;}
}

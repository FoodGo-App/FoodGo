package fit.iuh.foodgobackend.fulfillment;

import fit.iuh.foodgobackend.common.*;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableScheduling
public class OfferExpiryScheduler {
 private static final Logger LOG=LoggerFactory.getLogger(OfferExpiryScheduler.class);
 private final JpaSql db;private final FulfillmentService service;
 public OfferExpiryScheduler(JpaSql db,FulfillmentService service){this.db=db;this.service=service;}
 @Scheduled(fixedDelayString="${foodgo.offer-scan-ms:1000}")
 public void expire(){
  // Each call crosses the service proxy and commits its own order transaction.
  for(var row:db.rows("SELECT DISTINCT order_id FROM driver_offers WHERE status='OFFERED' AND expires_at<=UTC_TIMESTAMP(3) ORDER BY order_id LIMIT 100")){
   try{service.expire(Data.n(row,"order_id"));}catch(RuntimeException e){LOG.warn("Offer expiration will retry order {}: {}",Data.n(row,"order_id"),e.getClass().getSimpleName());}
  }
 }
}

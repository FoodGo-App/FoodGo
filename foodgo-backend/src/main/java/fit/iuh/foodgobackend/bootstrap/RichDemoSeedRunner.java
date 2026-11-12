package fit.iuh.foodgobackend.bootstrap;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
@Component @Order(100)
@ConditionalOnProperty(name="foodgo.rich-seed-enabled",havingValue="true")
public class RichDemoSeedRunner implements ApplicationRunner {
 private final RichDemoSeedService service;private final ConfigurableApplicationContext context;private final boolean exit;
 public RichDemoSeedRunner(RichDemoSeedService service,ConfigurableApplicationContext context,@Value("${foodgo.rich-seed-exit:false}") boolean exit){this.service=service;this.context=context;this.exit=exit;}
 @Override public void run(ApplicationArguments args){service.seed();org.slf4j.LoggerFactory.getLogger(getClass()).info("Rich sample data ready (versioned and idempotent).");if(exit)context.close();}
}

package fit.iuh.foodgobackend.bootstrap;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Property-gated local demo bootstrap; Flyway creates the schema before runners execute. */
@org.springframework.context.annotation.Profile("local & !prod & !test & !m01-test & !flow-test")
@org.springframework.core.annotation.Order(30)
@Component
@ConditionalOnProperty(name = "foodgo.seed-enabled", havingValue = "true")
public class DemoSeedRunner implements ApplicationRunner {
    private final DemoSeedService seed;

    public DemoSeedRunner(DemoSeedService seed) {
        this.seed = seed;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed.seed();
    }
}

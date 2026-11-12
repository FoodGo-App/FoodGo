package fit.iuh.foodgobackend.config;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.cfg.CoercionAction;
import tools.jackson.databind.cfg.CoercionInputShape;
import tools.jackson.databind.type.LogicalType;

@Configuration
public class JacksonConfig {
 @Bean
 JsonMapperBuilderCustomizer strictIntegralInputs(){
  // Preserve string IDs and omitted optional booleans such as replaceRestaurant.
  // Floating point JSON values must never be truncated into quantities, IDs or versions.
  return builder->builder.disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT,DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES)
   .withCoercionConfig(LogicalType.Integer,c->c.setCoercion(CoercionInputShape.Float,CoercionAction.Fail));
 }
}

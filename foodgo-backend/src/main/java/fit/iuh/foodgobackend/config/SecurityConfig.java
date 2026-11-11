package fit.iuh.foodgobackend.config;
import fit.iuh.foodgobackend.account.*;
import fit.iuh.foodgobackend.common.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.*;
import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.cors.*;
@Configuration public class SecurityConfig {
 @Bean SecurityFilterChain security(HttpSecurity http,AuthService auth,@Value("${foodgo.cors-origins}") String origins)throws Exception{
  var cors=new CorsConfiguration();cors.setAllowedOrigins(Arrays.asList(origins.split(",")));cors.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));cors.setAllowedHeaders(List.of("Authorization","Content-Type","Idempotency-Key"));var source=new UrlBasedCorsConfigurationSource();source.registerCorsConfiguration("/**",cors);
  var filter=new OncePerRequestFilter(){@Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{String header=req.getHeader("Authorization");if(header!=null){try{Data.require(header.startsWith("Bearer ")&&header.length()<=512,401,"AUTH_REQUIRED","Phiên không hợp lệ.");var user=auth.authenticate(header.substring(7));SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user,null,List.of(new SimpleGrantedAuthority("ROLE_"+user.role()))));}catch(ApiException e){write(res,e.status,e.code,e.getMessage());return;}}chain.doFilter(req,res);}};
  return http.csrf(c->c.disable()).cors(c->c.configurationSource(source)).sessionManagement(c->c.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).authorizeHttpRequests(c->c.requestMatchers("/api/v1/auth/login","/api/v1/catalog/**","/api/v1/health","/error").permitAll().anyRequest().authenticated()).exceptionHandling(c->c.authenticationEntryPoint((req,res,e)->write(res,401,"AUTH_REQUIRED","Bạn cần đăng nhập.")).accessDeniedHandler((req,res,e)->write(res,403,"FORBIDDEN","Không có quyền truy cập."))).addFilterBefore(filter,UsernamePasswordAuthenticationFilter.class).build();
 }
 private static void write(HttpServletResponse res,int status,String code,String message)throws IOException{res.setStatus(status);res.setContentType("application/json;charset=UTF-8");res.getWriter().write(Data.json(Api.error(code,message)));}
}

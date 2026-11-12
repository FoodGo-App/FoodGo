package fit.iuh.foodgobackend.common;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
@RestControllerAdvice
public class ApiErrors {
 @ExceptionHandler(ApiException.class) ResponseEntity<?> business(ApiException e){return ResponseEntity.status(e.status).body(Api.error(e.code,e.getMessage()));}
 @ExceptionHandler({MethodArgumentNotValidException.class,org.springframework.web.bind.MissingServletRequestParameterException.class,HttpMessageNotReadableException.class,ConstraintViolationException.class,MethodArgumentTypeMismatchException.class}) ResponseEntity<?> invalid(Exception e,jakarta.servlet.http.HttpServletRequest request){return ResponseEntity.badRequest().body(Api.error(request.getRequestURI().startsWith("/api/v1/addresses")?"VALIDATION_ERROR":"INVALID_INPUT","Dữ liệu gửi lên không hợp lệ."));}
 @ExceptionHandler({CannotAcquireLockException.class,PessimisticLockingFailureException.class}) ResponseEntity<?> retry(Exception e){return ResponseEntity.status(409).body(Api.error("RETRYABLE_CONFLICT","Dữ liệu đang được xử lý. Tra cứu kết quả trước khi thử lại cùng mã."));}
 @ExceptionHandler(DataIntegrityViolationException.class) ResponseEntity<?> integrity(Exception e){return ResponseEntity.status(409).body(Api.error("RETRYABLE_CONFLICT","Dữ liệu vừa thay đổi. Hãy tải lại và kiểm tra kết quả."));}
 @ExceptionHandler(Exception.class) ResponseEntity<?> unexpected(Exception e){org.slf4j.LoggerFactory.getLogger(ApiErrors.class).error("API processing failed",e);return ResponseEntity.internalServerError().body(Api.error("INTERNAL_ERROR","Chưa thể xử lý yêu cầu. Hãy tra cứu kết quả trước khi gửi lại."));}
}

package fit.iuh.foodgobackend.account;
import fit.iuh.foodgobackend.common.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Validation;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class AddressServiceTests {
 private final JpaSql db=mock(JpaSql.class);
 private final AccountRepository repo=mock(AccountRepository.class);
 private final UserPrincipal customer=new UserPrincipal(7,"test","CUSTOMER",null,"test-only-hash");
 private AddressService service(){when(repo.db()).thenReturn(db);return new AddressService(repo);}
 private AddressService.Input valid(){return new AddressService.Input("Test","0900000000","Test address","Nhà","AREA_A","CUSTOMER_A");}
 @Test void limitIs409BeforeInsert(){var s=service();when(db.rows(anyString(),eq(7L))).thenReturn(Collections.nCopies(10,Data.m("id",1)));var e=assertThrows(ApiException.class,()->s.save(customer,null,valid()));assertEquals(409,e.status);assertEquals("ADDRESS_LIMIT",e.code);verify(db,never()).insert(anyString(),anyMap());}
 @Test void otherOwnerCannotEditOrDelete(){var s=service();when(db.required("SELECT id FROM addresses WHERE id=? AND customer_id=?",3L,7L)).thenThrow(new ApiException(404,"NOT_FOUND","test"));assertEquals(404,assertThrows(ApiException.class,()->s.save(customer,3L,valid())).status);assertEquals(404,assertThrows(ApiException.class,()->s.delete(customer,3L)).status);assertTrue(mockingDetails(db).getInvocations().stream().noneMatch(i->i.getMethod().getName().equals("update")));}
 @Test void roleAndAreaRejectedBeforeWrite(){var s=service();assertEquals(403,assertThrows(ApiException.class,()->s.list(new UserPrincipal(2,"test","DRIVER",null,"test"))).status);var bad=new AddressService.Input("Test","0900000000","Test","Nhà","OTHER","CUSTOMER_A");assertEquals(400,assertThrows(ApiException.class,()->s.save(customer,null,bad)).status);verify(db,never()).insert(anyString(),anyMap());}
 @Test void createReturns201(){var s=mock(AddressService.class);when(s.save(eq(customer),isNull(),any())).thenReturn(Map.of("id","1"));Object response=new AddressController(s).add(customer,valid());assertEquals(201,((ResponseEntity<?>)response).getStatusCode().value());}
 @Test void inputValidatesPhoneAndLimits(){try(var factory=Validation.buildDefaultValidatorFactory()){var v=factory.getValidator();assertTrue(v.validate(valid()).isEmpty());assertFalse(v.validate(new AddressService.Input(" ","123"," ","x".repeat(41),"x".repeat(31),"CUSTOMER_A")).isEmpty());}}
 @Test void deleteOnlyAddressesWithOwnerScope(){var s=service();when(db.required(anyString(),eq(3L),eq(7L))).thenReturn(Map.of("id",3));s.delete(customer,3);verify(db).update("DELETE FROM addresses WHERE id=? AND customer_id=?",3L,7L);assertTrue(mockingDetails(db).getInvocations().stream().filter(i->i.getMethod().getName().equals("update")).allMatch(i->i.getArgument(0,String.class).contains("addresses")));}
}

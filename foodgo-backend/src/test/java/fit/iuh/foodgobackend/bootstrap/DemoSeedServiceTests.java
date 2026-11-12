package fit.iuh.foodgobackend.bootstrap;

import fit.iuh.foodgobackend.cart.CartService;
import fit.iuh.foodgobackend.common.JpaSql;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Map;

import static fit.iuh.foodgobackend.common.Data.m;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DemoSeedServiceTests {
    // JpaSql.one returns null for a missing row; Mockito otherwise supplies an empty Map.
    private final JpaSql db = mock(JpaSql.class, invocation ->
            Map.class.equals(invocation.getMethod().getReturnType())
                    ? null : RETURNS_DEFAULTS.answer(invocation));
    private final CartService carts = mock(CartService.class);
    private final DemoSeedService seed = new DemoSeedService(db, carts, "local-demo-password");

    @Test
    void existingAccountKeepsItsPasswordAndRole() {
        var existing = m("id", 803L, "password_hash", "custom-hash", "role", "CUSTOMER");
        when(db.one("SELECT * FROM users WHERE username=?", "customer-1")).thenReturn(existing);

        assertSame(existing, seed.ensureUser("customer-1", "Demo", "CUSTOMER", null, null));

        verify(db, never()).insert(anyString(), anyMap());
        verify(db, never()).update(anyString(), any(Object[].class));
        assertEquals("custom-hash", existing.get("password_hash"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void newAccountUsesGeneratedIdAndBcryptPassword() {
        when(db.insert(eq("users"), anyMap())).thenReturn(812L);

        var account = seed.ensureUser("customer-2", "Demo", "CUSTOMER", null, null);

        var values = ArgumentCaptor.forClass(Map.class);
        verify(db).insert(eq("users"), values.capture());
        assertEquals(812L, account.get("id"));
        var encoded = values.getValue().get("password_hash").toString();
        assertNotEquals("local-demo-password", encoded);
        assertTrue(new BCryptPasswordEncoder().matches("local-demo-password", encoded));
    }

    @Test
    void existingEmptyCartIsNotRefilledAfterRestart() {
        when(db.one("SELECT id FROM carts WHERE customer_id=?", 803L)).thenReturn(m("id", 87L));

        seed.seedCustomerCart(customer(), 207L, 209L, java.util.List.of(311L, 312L, 313L));

        verifyNoInteractions(carts);
        verify(db, never()).insert(anyString(), anyMap());
    }

    @Test
    void customerWithOrdersAndMissingCartDoesNotReceiveAnotherFixture() {
        when(db.one("SELECT id FROM orders WHERE customer_id=? LIMIT 1", 803L)).thenReturn(m("id", 91L));

        seed.seedCustomerCart(customer(), 207L, 209L, java.util.List.of(311L, 312L, 313L));

        verifyNoInteractions(carts);
        verify(db, never()).insert(anyString(), anyMap());
    }

    @Test
    void firstCartUsesBusinessServiceAndDoesNotRepeatOnSecondRun() {
        when(db.one("SELECT id FROM carts WHERE customer_id=?", 803L))
                .thenReturn(null, m("id", 87L));
        when(db.insert(eq("carts"), anyMap())).thenReturn(87L);
        var options = java.util.List.of(313L, 311L, 312L);

        seed.seedCustomerCart(customer(), 207L, 209L, options);
        seed.seedCustomerCart(customer(), 207L, 209L, options);

        var input = ArgumentCaptor.forClass(CartService.ItemInput.class);
        verify(carts, times(2)).add(any(), input.capture(), isNull());
        assertEquals(207L, input.getAllValues().get(0).foodId());
        assertEquals(2, input.getAllValues().get(0).quantity());
        assertEquals(options, input.getAllValues().get(0).optionValueIds());
        assertEquals(0L, input.getAllValues().get(0).expectedVersion());
        assertEquals(209L, input.getAllValues().get(1).foodId());
        assertEquals(1, input.getAllValues().get(1).quantity());
        assertEquals(1L, input.getAllValues().get(1).expectedVersion());
        verify(db, times(1)).insert(eq("carts"), anyMap());
    }

    @Test
    void anExistingCustomerAddressIsPreserved() {
        when(db.one("SELECT id FROM addresses WHERE customer_id=? LIMIT 1", 803L))
                .thenReturn(m("id", 401L));

        seed.ensureAddress(customer(), "CUSTOMER_A", "0912345678");

        verify(db, never()).insert(anyString(), anyMap());
    }

    private Map<String, Object> customer() {
        return m("id", 803L, "role", "CUSTOMER", "display_name", "Demo customer");
    }
}

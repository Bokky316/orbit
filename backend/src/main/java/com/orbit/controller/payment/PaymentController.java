// package com.orbit.controller.payment;

// import com.orbit.entity.payment.Payment;
// import com.orbit.service.payment.PaymentService;
// import lombok.RequiredArgsConstructor;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;
// import java.util.Optional;

// @RestController
// @RequestMapping("/api/payments")
// @RequiredArgsConstructor
// public class PaymentController {

//     private final PaymentService paymentService;

//     @GetMapping
//     public List<Payment> getAllPayments() {
//         return paymentService.getAllPayments();
//     }

//     @GetMapping("/{id}")
//     public Optional<Payment> getPaymentById(@PathVariable Long id) {
//         return paymentService.getPaymentById(id);
//     }

//     @PostMapping
//     public Payment createPayment(@RequestBody Payment payment) {
//         return paymentService.createPayment(payment);
//     }

//     @DeleteMapping("/{id}")
//     public void deletePayment(@PathVariable Long id) {
//         paymentService.deletePayment(id);
//     }
// }

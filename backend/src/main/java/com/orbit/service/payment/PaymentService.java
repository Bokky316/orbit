// package com.orbit.service.payment;

// import com.orbit.entity.payment.Payment;
// import com.orbit.repository.payment.PaymentRepository;
// import lombok.RequiredArgsConstructor;
// import org.springframework.stereotype.Service;

// import java.util.List;
// import java.util.Optional;

// @Service
// @RequiredArgsConstructor
// public class PaymentService {

//     private final PaymentRepository paymentRepository;

//     public List<Payment> getAllPayments() {
//         return paymentRepository.findAll();
//     }

//     public Optional<Payment> getPaymentById(Long id) {
//         return paymentRepository.findById(id);
//     }

//     public Payment createPayment(Payment payment) {
//         return paymentRepository.save(payment);
//     }

//     public void deletePayment(Long id) {
//         paymentRepository.deleteById(id);
//     }
// }

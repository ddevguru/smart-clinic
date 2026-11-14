import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patient_app/core/widgets/custom_button.dart';
import 'package:patient_app/core/widgets/custom_text_field.dart';
import 'package:patient_app/core/widgets/status_badge.dart';
import 'package:patient_app/core/widgets/token_card.dart';

void main() {
  group('Phase 5 UI Widgets Unit & Widget Tests', () {
    testWidgets('StatusBadge renders correct status and label', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StatusBadge(status: 'WAITING'),
          ),
        ),
      );

      expect(find.text('WAITING'), findsOneWidget);
    });

    testWidgets('CustomButton renders text, responds to tap and shows loading spinner',
        (tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Book Consultation',
              onPressed: () => tapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Book Consultation'), findsOneWidget);
      await tester.tap(find.text('Book Consultation'));
      expect(tapped, true);

      // Test loading state
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Book Consultation',
              isLoading: true,
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('CustomTextField accepts input and triggers onChanged callback',
        (tester) async {
      String changedText = '';

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              label: 'Phone Number',
              hint: 'Enter 10-digit number',
              onChanged: (val) => changedText = val,
            ),
          ),
        ),
      );

      expect(find.text('Phone Number'), findsOneWidget);
      expect(find.text('Enter 10-digit number'), findsOneWidget);

      await tester.enterText(find.byType(TextField), '9876543210');
      expect(changedText, '9876543210');
    });

    testWidgets('TokenCard renders token number, wait time and doctor info accurately',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TokenCard(
              tokenNumber: 'A001',
              status: 'WAITING',
              patientsAhead: 2,
              estimatedWaitMinutes: 30,
              doctorName: 'Dr. Priya Patel',
              specialty: 'Pediatrics',
              clinicName: 'Apollo Care',
            ),
          ),
        ),
      );

      expect(find.text('A001'), findsOneWidget);
      expect(find.text('LIVE QUEUE TOKEN'), findsOneWidget);
      expect(find.text('2 ahead of you'), findsOneWidget);
      expect(find.text('~30 mins wait'), findsOneWidget);
      expect(find.text('Dr. Priya Patel'), findsOneWidget);
      expect(find.text('Pediatrics • Apollo Care'), findsOneWidget);
    });
  });
}

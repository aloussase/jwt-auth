import { URIS, Kind } from "fp-ts/HKT";
import { Option } from "fp-ts/lib/Option";

export interface Quincena {
  id: number,
  user_id: number,
  start_date: Date,
  available: number,
}

export interface Payment {
  id: number,
  quincena_id: number,
  description: string,
  amount: number,
  fulfilled: boolean,
}

export default interface PaymentSymmantics<F extends URIS> {
  /**
   * Create a new quincena.
   */
  readonly createQuincena: (user_id: number, start_date: Date, available: number) => Kind<F, Option<Quincena>>

  /**
   * Get all quincenas for a specified user.
   */
  readonly getAllQuincenas: (user_id: number) => Kind<F, Quincena[]>

  /**
   * Create a new payment in the provided quincena.
   */
  readonly createPayment: (quincena_id: number, description: string, amount: number) => Kind<F, Option<Payment>>

  /**
   * Get all payments for a given quincena.
   */
  readonly getAllPayments: (quincena_id: number) => Kind<F, Payment[]>

  /**
   * Fulfill the specified payment.
   */
  readonly fulfillPayment: (payment_id: number) => Kind<F, boolean>;
}

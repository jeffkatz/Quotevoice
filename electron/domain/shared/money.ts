export class Money {
    // We work with integers (cents) to avoid floating point errors
    private amount: number; // in cents

    constructor(amountInCents: number) {
        this.amount = Math.round(amountInCents);
    }

    static fromFloat(amount: number): Money {
        return new Money(amount * 100);
    }

    static fromCents(amount: number): Money {
        return new Money(amount);
    }

    add(other: Money): Money {
        return new Money(this.amount + other.amount);
    }

    subtract(other: Money): Money {
        return new Money(this.amount - other.amount);
    }

    multiply(factor: number): Money {
        return new Money(this.amount * factor);
    }

    // Returns float for storage/display
    toFloat(): number {
        return this.amount / 100;
    }

    toCents(): number {
        return this.amount;
    }
}

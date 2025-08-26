// INDIA LOCALIZATION - OMNI-AGENT NEXUS vULTIMA
// Complete India-aware formatting and localization

export class IndiaLocalization {
  private static instance: IndiaLocalization;

  static getInstance(): IndiaLocalization {
    if (!IndiaLocalization.instance) {
      IndiaLocalization.instance = new IndiaLocalization();
    }
    return IndiaLocalization.instance;
  }

  // CURRENCY FORMATTING (Indian Rupee with proper grouping)
  formatCurrency(amount: number): string {
    // Indian number system: 1,23,45,678
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
  }

  formatCurrencyCompact(amount: number): string {
    if (amount >= 10000000) { // 1 crore
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) { // 1 lakh
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) { // 1 thousand
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  }

  // DATE FORMATTING (dd-mm-yyyy format)
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  }

  formatDateTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    }) + ' IST';
  }

  formatTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    }) + ' IST';
  }

  // RELATIVE TIME (India-aware)
  formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const target = new Date(date);
    const diffMs = now.getTime() - target.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'अभी (just now)';
    if (diffMinutes < 60) return `${diffMinutes} मिनट पहले (${diffMinutes} min ago)`;
    if (diffHours < 24) return `${diffHours} घंटे पहले (${diffHours} hours ago)`;
    if (diffDays < 7) return `${diffDays} दिन पहले (${diffDays} days ago)`;
    
    return this.formatDate(date);
  }

  // NUMBER FORMATTING (Indian system)
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-IN').format(num);
  }

  // BUSINESS HOURS (India timezone)
  isBusinessHours(): boolean {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hour = istTime.getHours();
    return hour >= 9 && hour <= 18; // 9 AM to 6 PM IST
  }

  getBusinessHoursMessage(): string {
    if (this.isBusinessHours()) {
      return 'Our support team is available now (9 AM - 6 PM IST)';
    }
    return 'Support available during business hours (9 AM - 6 PM IST)';
  }

  // REGIONAL CONTENT
  getRegionalGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'सुप्रभात (Good Morning)';
    if (hour < 17) return 'नमस्ते (Good Afternoon)';
    return 'शुभ संध्या (Good Evening)';
  }

  // PAYMENT METHODS (India-specific)
  getSupportedPaymentMethods(): Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    popular: boolean;
  }> {
    return [
      {
        id: 'upi',
        name: 'UPI',
        description: 'Pay with any UPI app (GPay, PhonePe, Paytm)',
        icon: '📱',
        popular: true
      },
      {
        id: 'netbanking',
        name: 'Net Banking',
        description: 'All major Indian banks supported',
        icon: '🏦',
        popular: true
      },
      {
        id: 'cards',
        name: 'Cards',
        description: 'Debit/Credit cards (Visa, Mastercard, RuPay)',
        icon: '💳',
        popular: false
      },
      {
        id: 'wallets',
        name: 'Wallets',
        description: 'Paytm, PhonePe, Amazon Pay',
        icon: '👛',
        popular: false
      }
    ];
  }

  // VALIDATION (India-specific)
  validateIndianPhone(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  validateGST(gst: string): boolean {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  }

  // CONTENT LOCALIZATION
  getLocalizedContent(key: string): string {
    const content: Record<string, string> = {
      welcome: 'स्वागत है! Welcome to Prompt Battle Arena',
      battle_complete: 'युद्ध समाप्त! Battle Complete!',
      winner_announcement: 'विजेता! Winner!',
      loading: 'लोड हो रहा है... Loading...',
      error: 'त्रुटि! Error occurred',
      success: 'सफल! Success!',
      premium_upgrade: 'प्रीमियम में अपग्रेड करें! Upgrade to Premium!',
      daily_limit: 'दैनिक सीमा! Daily Limit Reached'
    };

    return content[key] || key;
  }
}

export const indiaLocalization = IndiaLocalization.getInstance();

// CONVENIENCE FUNCTIONS
export const formatINR = (amount: number) => indiaLocalization.formatCurrency(amount);
export const formatINRCompact = (amount: number) => indiaLocalization.formatCurrencyCompact(amount);
export const formatIndianDate = (date: string | Date) => indiaLocalization.formatDate(date);
export const formatIndianDateTime = (date: string | Date) => indiaLocalization.formatDateTime(date);
export const formatIndianNumber = (num: number) => indiaLocalization.formatNumber(num);
import { getBaseEmailLayout } from './email-layout';

export const getDonationSuccessEmail = (
  amount: number,
  reference: string,
  currency: string = 'GHS',
): string => {
  const formattedAmount = `${currency} ${amount.toFixed(2)}`;

  const content = `
    <h1>Thank You for Your Donation!</h1>
    <p>Hello,</p>
    <p>We have successfully received your generous donation. Your support drives critical ongoing efforts, and we deeply appreciate your contributions.</p>
    
    <table class="data-table">
        <tbody>
            <tr>
                <th>Receipt Reference</th>
                <td>${reference}</td>
            </tr>
            <tr>
                <th>Total Amount</th>
                <td class="highlight" style="font-size: 18px;">${formattedAmount}</td>
            </tr>
            <tr>
                <th>Date</th>
                <td>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
        </tbody>
    </table>
    
    <p>This email serves as your official receipt.</p>
    <p>Once again, thank you for your incredible generosity!</p>
  `;

  return getBaseEmailLayout(content, 'Donation Receipt');
};

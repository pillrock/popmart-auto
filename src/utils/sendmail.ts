import nodemailer from 'nodemailer';
import env from '../../env.json';
export default class MailService {
  private receiverEmail: string;
  private transporter: nodemailer.Transporter;

  constructor(receiverEmail: string) {
    this.receiverEmail = receiverEmail;
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: env.mailUser,
        pass: env.mailPass,
      },
    });
  }

  public async sendMail({
    emailAccount,
    nameProduct,
    price,
    imgUrl,
    resultOrder,
  }: {
    emailAccount: string;
    nameProduct: string;
    price: string;
    imgUrl: string;
    resultOrder: { option: 'one' | 'box'; quantity: number };
  }): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: '"Popmart Auto" <no-reply@gmail.com>',
        to: this.receiverEmail,
        subject: 'ĐẶT HÀNG THÀNH CÔNG ✅',
        html: `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>ĐẶT HÀNG THÀNH CÔNG ✅</title>
    <style>
      @media only screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          padding: 12px !important;
        }
        .hero-img {
          width: 100% !important;
          height: auto !important;
        }
        .product-container {
          flex-direction: column !important;
        }
        .product-image-container {
          width: 100% !important;
          margin-right: 0 !important;
          margin-bottom: 16px !important;
        }
        .product-info {
          width: 100% !important;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 20px; background: #f2f4f7; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
            style="width: 600px; max-width: 600px; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);">
            
            <!-- Header -->
            <tr>
              <td style="padding: 0">
                <img class="hero-img" src="https://shinhan.com.vn/public/uploads/card/QUYNH/2025/Popmart_debit/popmart-1600x280.png"
                  alt="Popmart" style="display: block; width: 100%; height: auto; object-fit: cover;"/>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 24px">
                <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #111827; font-weight: 600;">
                  Đơn hàng của bạn đã được đặt thành công
                </h2>
                <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Cảm ơn bạn đã sử dụng Popmart Auto. Dưới đây là thông tin sản phẩm và hướng dẫn thanh toán.
                </p>

                <!-- Product Section -->
                <div style="border-top: 1px solid #eef2f7; padding-top: 18px;">
                  <div class="product-container" style="display: flex; flex-wrap: nowrap; margin-bottom: 16px;">
                    
                    <!-- Product Image -->
                    <div class="product-image-container" style="width: 150px; margin-right: 20px; flex-shrink: 0;">
                      <img src="${imgUrl}" alt="${nameProduct}"
                        style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; border: 1px solid #f0f0f0; display: block;"/>
                      
                      <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;
                        background: #f0f9ff; padding: 6px 8px; border-radius: 6px; color: #0369a1; font-size: 13px; font-weight: 500;">
                        <span>${resultOrder.option === 'one' ? 'CÁI' : 'HỘP'}</span>
                        <span>x${resultOrder.quantity}</span>
                      </div>
                    </div>
                    
                    <!-- Product Info -->
                    <div class="product-info" style="flex-grow: 1;">
                      <h3 style="margin: 0 0 6px 0; font-size: 16px; color: #111827; font-weight: 600;">
                        ${nameProduct}
                      </h3>
                      <div style="color: #06b6d4; font-weight: 700; font-size: 15px; margin-bottom: 12px;">
                        ${price}
                      </div>
                      <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                        Hãy đăng nhập vào PopMart (jp) bằng Email: <strong>${emailAccount}</strong>.
                        Quá trình thanh toán diễn ra trong 15 phút.
                      </p>
                      <a href="https://www.popmart.com/jp/account" target="_blank"
                        style="display: inline-block; padding: 12px 18px; background: #2563eb; color: #ffffff;
                        text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                        Đăng nhập & Thanh toán
                      </a>
                    </div>
                  </div>
                </div>

                <!-- Footer Note -->
                <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                  Nếu bạn không còn nhu cầu về đơn hàng này, vui lòng bỏ qua email. 
                  PopMart sẽ tự xóa quy trình thanh toán sau 15 phút.
                </p>
              </td>
            </tr>

            <!-- Decorative Line -->
            <tr>
              <td style="padding: 0">
                <div style="height: 6px; background: linear-gradient(90deg, #06b6d4, #7c3aed);"></div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 16px 24px; background: #f9fafb; color: #6b7280; font-size: 12px;">
                <div style="text-align: center;">
                  © Popmart Auto - Hệ thống đặt hàng tự động
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
      });
      console.log(`✅ Gửi mail thành công cho: ${this.receiverEmail}`);
      return true;
    } catch (err) {
      console.error('❌ Gửi mail thất bại:', err);
      return false;
    }
  }
}

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
  }: {
    emailAccount: string;
    nameProduct: string;
    price: string;
    imgUrl: string;
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
        .product-block {
          display: block !important;
          width: 100% !important;
        }
        .product-image {
          width: 120px !important;
          height: auto !important;
          margin: 0 auto 12px;
          display: block;
        }
      }
    </style>
  </head>
  <body
    style="
      margin: 0;
      padding: 20px;
      background: #f2f4f7;
      font-family: Helvetica, Arial, sans-serif;
    "
  >
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table
            class="container"
            width="600"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="
              width: 600px;
              max-width: 600px;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
            "
          >
            <!-- Header image -->
            <tr>
              <td style="padding: 0">
                <img
                  class="hero-img"
                  src="https://shinhan.com.vn/public/uploads/card/QUYNH/2025/Popmart_debit/popmart-1600x280.png"
                  alt="Popmart"
                  style="
                    display: block;
                    width: 100%;
                    height: auto;
                    object-fit: cover;
                  "
                />
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 24px">
                <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #111827">
                  Đơn hàng của bạn đã được đặt thành công
                </h2>
                <p
                  style="
                    margin: 0 0 18px 0;
                    color: #6b7280;
                    font-size: 14px;
                    line-height: 1.5;
                  "
                >
                  Cảm ơn bạn đã sử dụng Popmart Auto. Dưới đây là thông tin sản
                  phẩm và hướng dẫn thanh toán.
                </p>

                <!-- Product block -->
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="border-top: 1px solid #eef2f7; padding-top: 18px"
                >
                  <tr>
                    <td style="padding: 16px 0">
                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        role="presentation"
                      >
                        <tr style="vertical-align: top">
                          <!-- ảnh sản phẩm -->
                          <td
                            class="product-block"
                            width="150"
                            style="width: 150px; padding-right: 16px"
                          >
                            <img
                              class="product-image"
                              src="${imgUrl}"
                              alt="${nameProduct}"
                              style="
                                display: block;
                                width: 150px;
                                height: 150px;
                                object-fit: cover;
                                border-radius: 8px;
                                border: 1px solid #e6eef6;
                              "
                            />
                          </td>

                          <!-- thông tin -->
                          <td style="padding-top: 4px">
                            <div
                              style="
                                font-size: 16px;
                                color: #111827;
                                font-weight: 600;
                                margin-bottom: 6px;
                              "
                            >
                              ${nameProduct}
                            </div>
                            <div
                              style="
                                font-size: 14px;
                                color: #06b6d4;
                                font-weight: 700;
                                margin-bottom: 12px;
                              "
                            >
                              ${price}
                            </div>
                            <div
                              style="
                                font-size: 13px;
                                color: #6b7280;
                                line-height: 1.5;
                              "
                            >Hãy đăng nhập vào PopMart (jp) bằng Email: ${emailAccount}. Quá trình thanh toán diễn ra trong 15 phút.</div>
                            
                            <!-- CTA -->
                            <div style="margin-top: 16px">
                              <a
                                href="https://www.popmart.com/jp/account"
                                target="_blank"
                                style="
                                  display: inline-block;
                                  padding: 12px 18px;
                                  background: #2563eb;
                                  color: #ffffff;
                                  text-decoration: none;
                                  border-radius: 8px;
                                  font-weight: 600;
                                  font-size: 14px;
                                "
                              >
                                Đăng nhập & Thanh toán
                              </a>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Note nhỏ -->
                <p style="margin: 18px 0 0 0; color: #9ca3af; font-size: 12px">
                  Nếu bạn không còn nhu cầu về đơn hàng này, vui lòng bỏ qua email. PopMart sẽ tự xóa quy trình thanh toán
                </p>
              </td>
            </tr>

            <!-- Footer line -->
            <tr>
              <td style="padding: 0">
                <div
                  style="
                    height: 6px;
                    background: linear-gradient(90deg, #06b6d4, #7c3aed);
                  "
                ></div>
              </td>
            </tr>

            <!-- Footer content -->
            <tr>
              <td
                style="
                  padding: 16px 24px;
                  background: #f9fafb;
                  color: #6b7280;
                  font-size: 12px;
                "
              >
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                  "
                >
                  <div>© Popmart Auto.</div>
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

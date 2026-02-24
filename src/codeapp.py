import streamlit as st
import google.generativeai as genai

# 1. Giao diện
st.set_page_config(page_title="Trợ lý Quản lý Chi tiêu", page_icon="💰")
st.title("💰 Trợ lý Quản lý Chi tiêu")

# 2. Kiểm tra và Cấu hình API Key
if "GEMINI_API_KEY" not in st.secrets:
    st.error("Lỗi: Bạn chưa nhập API Key vào phần Secrets của Streamlit!")
    st.stop()

genai.configure(api_key=st.secrets["GEMINI_API_KEY"])

# 3. Nhập liệu
thu_nhap = st.number_input("Nhập tổng thu nhập (VNĐ):", min_value=0, value=10000000, step=500000)
danh_sach = st.text_area("Nhập danh sách chi tiêu:", placeholder="Ví dụ: Tiền nhà 5tr, Ăn sáng 30k...", height=150)

if st.button("Lập bảng thống kê"):
    if not danh_sach:
        st.warning("Vui lòng nhập nội dung chi tiêu.")
    else:
        try:
            # Sử dụng model 'gemini-1.5-flash' - đây là model ổn định và nhanh nhất hiện nay
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
            Bạn là chuyên gia tài chính. Thu nhập: {thu_nhap} VNĐ. 
            Dữ liệu chi tiêu: {danh_sach}.
            Hãy tạo bảng thống kê gồm: STT, Nội dung, Số tiền (VNĐ).
            Sau đó tính: Tổng chi và Số tiền dư còn lại.
            Trả về dưới dạng bảng Markdown rõ ràng.
            """
            
            with st.spinner('AI đang tính toán...'):
                response = model.generate_content(prompt)
                st.markdown("### Kết quả thống kê:")
                st.markdown(response.text)
                
        except Exception as e:
            st.error(f"Đã xảy ra lỗi kết nối AI: {e}")
            st.info("Gợi ý: Hãy kiểm tra lại xem API Key của bạn có còn hạn hoặc có đúng không.")

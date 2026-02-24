import streamlit as st
import google.generativeai as genai

# Cấu hình giao diện
st.set_page_config(page_title="Trợ lý Tài chính", page_icon="💰")
st.title("💰 Trợ lý Quản lý Chi tiêu")

# Kiểm tra Key trong Secrets
if "GEMINI_API_KEY" not in st.secrets:
    st.error("Lỗi: Bạn chưa nhập API Key vào Secrets!")
    st.stop()

# CẤU HÌNH QUAN TRỌNG: Thiết lập API Key
genai.configure(api_key=st.secrets["GEMINI_API_KEY"])

# Nhập liệu
thu_nhap = st.number_input("Nhập tổng thu nhập (VNĐ):", min_value=0, value=10000000)
danh_sach = st.text_area("Danh sách chi tiêu:", placeholder="Tiền nhà 5tr, điện 500k...", height=150)

if st.button("Lập bảng thống kê"):
    if not danh_sach:
        st.warning("Vui lòng nhập dữ liệu!")
    else:
        try:
            # SỬA TÊN MODEL Ở ĐÂY - Dùng gemini-1.5-flash là bản ổn định nhất của v1
            model = genai.GenerativeModel(model_name='gemini-1.5-flash')
            
            prompt = f"Thu nhập: {thu_nhap}. Chi tiêu: {danh_sach}. Lập bảng STT, Nội dung, Tiền. Tính tổng và dư."
            
            with st.spinner('Đang kết nối API v1...'):
                # Gọi API
                response = model.generate_content(prompt)
                st.markdown(response.text)
                
        except Exception as e:
            st.error(f"Lỗi: {e}")
            st.info("Mẹo: Nếu vẫn lỗi 404, hãy tạo API Key MỚI tại Google AI Studio vì Key cũ có thể bị kẹt ở v1beta.")

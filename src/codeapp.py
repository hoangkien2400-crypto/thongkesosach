import streamlit as st
import google.generativeai as genai
import pandas as pd
from io import BytesIO

# 1. Cấu hình trang web
st.set_page_config(page_title="Quản lý chi tiêu AI", layout="centered")
st.title("💰 Trợ lý Quản lý Chi tiêu")

# 2. Lấy API Key từ Secrets của Streamlit (Thiết lập trên web Streamlit sau)
try:
    api_key = st.secrets["GEMINI_API_KEY"]
    genai.configure(api_key=api_key)
except:
    st.error("Chưa cấu hình API Key trong phần Secrets!")

# 3. Giao diện nhập liệu
thu_nhap = st.number_input("Nhập tổng thu nhập (VNĐ):", min_value=0, step=100000)
danh_sach = st.text_area("Nhập danh sách chi tiêu (Ví dụ: Tiền nhà 5tr, Ăn sáng 30k...)", height=150)

if st.button("Lập bảng thống kê"):
    if danh_sach:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Prompt gửi cho AI
        prompt = f"""
        Thu nhập: {thu_nhap} VNĐ. 
        Danh sách chi tiêu: {danh_sach}.
        Hãy lập bảng thống kê chi tiết gồm: STT, Nội dung, Số tiền (VNĐ).
        Cuối cùng tính Tổng chi và Số dư còn lại.
        Trả về kết quả dưới dạng bảng Markdown.
        """
        
        response = model.generate_content(prompt)
        st.markdown(response.text)
        
        # Lưu ý: Chức năng xuất Excel thực sự cần xử lý logic Python phức tạp hơn, 
        # nhưng Gemini sẽ hiển thị bảng rất đẹp cho bạn copy.
    else:
        st.warning("Vui lòng nhập danh sách chi tiêu!")
export const buildQuery = (query) => {
    let { page, pageSize, filters } = query;

    // Xử lý filters:
    filters = JSON.parse(filters || "{}") || {};

    /**
     * Chuyển đổi các giá trị trong filters từ chuỗi đơn thành một đối tượng có dạng { contains: value }. Điều này thường dùng để phục vụ cho việc lọc dữ liệu theo kiểu "tìm kiếm gần đúng" (partial match), ví dụ như trong các truy vấn cơ sở dữ liệu hoặc API.
     * Object.entries(filters) sẽ trả về một mảng các cặp [key, value] từ object filters.
     * Vòng for sẽ duyệt qua từng cặp đó.
     * Nếu value là một chuỗi (typeof value === "string"), thì thay vì giữ nguyên chuỗi đó, nó sẽ được thay bằng một object có dạng { contains: value }.
     */
    for (const [key, value] of Object.entries(filters)) {
        if (typeof value === "string") {
            filters[key] = { contains: value };
        }
    }

    // console.log('\n');
    // console.log("Kêt quả:", filters);
    // console.log('\n');

    // console.log('Mong muốn:', {
    //     content: { contains: "abc" },
    // });
    // console.log('\n');

    const pageDefault = 1;
    const pageSizeDefault = 3;

    // Xử lý chuyển từ text sang number & xử lý lấy số dương (ko lấy số âm) & lấy con số ko lấy text
    page = Math.max(pageDefault, Number(page) || pageDefault);
    pageSize = Math.max(pageSizeDefault, Number(pageSize) || pageSizeDefault);

    console.log({ page, pageSize, filters });

    // Công thức tính phân trang = (page - 1) * pageSize;
    const skip = (page - 1) * pageSize;
    // const take = pageSize;

    return { page, pageSize, filters, skip };
}
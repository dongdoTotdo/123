// 1. 데이터 저장용 배열 (로컬스토리지에서 불러오거나 빈 배열로 시작)
let items = JSON.parse(localStorage.getItem('stressData')) || [];

// 페이지가 처음 열릴 때 기존 데이터를 화면에 그립니다.
renderList();

// 2. 계산 버튼 클릭 이벤트
document.getElementById('calculateBtn').addEventListener('click', function() {
    const force = document.getElementById('force').value;
    const area = document.getElementById('area').value;

    if (force === '' || area === '') {
        alert('숫자를 입력해주세요!');
        return;
    }

    // 응력 계산 (하중 / 면적)
    const stress = (parseFloat(force) / parseFloat(area)).toFixed(2);
    const date = new Date().toLocaleString();

    // 데이터 객체 생성
    const newItem = {
        date: date,
        force: force,
        area: area,
        stress: stress
    };

    // 배열에 넣고 로컬스토리지에 저장
    items.push(newItem);
    localStorage.setItem('stressData', JSON.stringify(items));

    // 화면 갱신
    renderList();
    
    // 입력창 비우기
    document.getElementById('force').value = '';
    document.getElementById('area').value = '';
});

// 3. 화면에 표를 그리는 함수
function renderList() {
    const resultBody = document.getElementById('resultBody');
    resultBody.innerHTML = '';

    items.forEach((item, index) => {
        const row = `
            <tr>
                <td>${item.date}</td>
                <td>${item.force}</td>
                <td>${item.area}</td>
                <td>${item.stress}</td>
                <td><button class="delete-btn" onclick="deleteItem(${index})">삭제</button></td>
            </tr>
        `;
        resultBody.insertAdjacentHTML('afterbegin', row);
    });
}

// 4. 삭제 함수
window.deleteItem = function(index) {
    items.splice(index, 1);
    localStorage.setItem('stressData', JSON.stringify(items));
    renderList();
};

// 5. 엑셀 내보내기
document.getElementById('downloadExcel').addEventListener('click', function() {
    if (items.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(items);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "StressResults");
    XLSX.writeFile(workbook, "Stress_Calculation_Results.xlsx");
});
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


const toleranceData ={
    "H7": [
        {min: 0, max: 3, upper: 10, lower: 0},
        {min: 3, max: 6, upper: 12, lower: 0},
        {min: 6, max: 10, upper: 15, lower: 0},
        {min: 10, max: 18, upper: 18, lower: 0},
        { min: 18, max: 30, upper: 21, lower: 0 },
        { min: 30, max: 50, upper: 25, lower: 0 }
    
    ]
};

document.getElementById('findToleranceBtn').addEventListener('click', function() {
    const size = parseFloat(document.getElementById('baseSize').value);
    const grade = document.getElementById('toleranceGrade').value;
    const resultDiv = document.getElementById('toleranceResult');

    if (!size) {
        alert("치수를 입력해!");
        return;
    }

    
    const gradeTable = toleranceData[grade];
    const match = gradeTable.find(item => size > item.min && size <= item.max);

    if (match) {
        
        const upperLimit = (size + match.upper / 1000).toFixed(3);
        const lowerLimit = (size + match.lower / 1000).toFixed(3);
        
        resultDiv.innerHTML = `
            <div style="background:#e1f5fe; padding:15px; border-radius:10px;">
                <p>📌 ${grade} 공차 결과 (단위: mm)</p>
                <p>최대 허용 치수: ${upperLimit}</p>
                <p>최소 허용 치수: ${lowerLimit}</p>
                <p style="font-size: 0.8rem; color: #666;">허용차: +${match.upper} / ${match.lower} μm</p>
            </div>
        `;
    } else {
        resultDiv.innerHTML = "❌ 해당 범위의 규격 데이터가 아직 없습니다.";
    }
});
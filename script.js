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
    ],        

    "g6": [
        { min: 0, max: 3, upper: -2, lower: -8 },
        { min: 3, max: 6, upper: -4, lower: -12 },
        { min: 6, max: 10, upper: -5, lower: -14 },
        { min: 10, max: 18, upper: -6, lower: -17 },
        { min: 18, max: 30, upper: -7, lower: -20 },
        { min: 30, max: 50, upper: -9, lower: -25 }
    
    ]
};

// 기존 맨 아래의 findToleranceBtn 이벤트를 이 코드로 교체합니다!
document.getElementById('findToleranceBtn').addEventListener('click', function() {
    const size = parseFloat(document.getElementById('baseSize').value);
    
    // [변경점] 구멍 등급과 축 등급을 각각 따로 가져옵니다!
    const holeGrade = document.getElementById('holeGrade').value;   // 예: "H7"
    const shaftGrade = document.getElementById('shaftGrade').value; // 예: "g6"
    const resultDiv = document.getElementById('toleranceResult');

    if (!size) {
        alert("기준 치수를 입력해주세요!");
        return;
    }

    // 1. 구멍(Hole) 데이터 테이블에서 해당 치수 범위 찾기
    const holeTable = toleranceData[holeGrade];
    const holeMatch = holeTable.find(item => size > item.min && size <= item.max);

    // 2. 축(Shaft) 데이터 테이블에서 해당 치수 범위 찾기
    const shaftTable = toleranceData[shaftGrade];
    const shaftMatch = shaftTable.find(item => size > item.min && size <= item.max);

    // 구멍과 축 데이터가 둘 다 존재할 때만 계산 시작!
    if (holeMatch && shaftMatch) {
        
        // 3. 구멍 및 축의 실치수 계산 (μm를 mm로 환산)
        const holeMax = size + (holeMatch.upper / 1000);
        const holeMin = size + (holeMatch.lower / 1000);
        const shaftMax = size + (shaftMatch.upper / 1000);
        const shaftMin = size + (shaftMatch.lower / 1000);

        // 4. 끼워맞춤 핵심 공식 계산
        const maxClearance = holeMax - shaftMin; // 최대 틈새
        const minClearance = holeMin - shaftMax; // 최소 틈새 (음수가 나오면 죔새가 됨)

        // 5. 조건문(if-else)을 활용한 컴퓨터의 자동 판별 알고리즘
        let fitType = "";
        let fitDetail = "";

        if (minClearance >= 0) {
            // 최소 틈새가 0 이상이면 항상 구멍이 더 큰 상태
            fitType = "🟢 헐거운 끼워맞춤 (Clearance Fit)";
            fitDetail = `최대 틈새: ${maxClearance.toFixed(3)} mm / 최소 틈새: ${minClearance.toFixed(3)} mm`;
        } 
        else if (maxClearance <= 0) {
            // 최대 틈새마저 0 이하이면 항상 축이 더 큰 상태
            fitType = "🔴 억지 끼워맞춤 (Interference Fit)";
            const maxInterference = Math.abs(minClearance); // 음수를 보기 좋게 양수(절댓값)로 변환
            const minInterference = Math.abs(maxClearance);
            fitDetail = `최대 죔새: ${maxInterference.toFixed(3)} mm / 최소 죔새: ${minInterference.toFixed(3)} mm`;
        } 
        else {
            // 구멍이 클 수도 있고, 축이 클 수도 있는 상태
            fitType = "🟡 중간 끼워맞춤 (Transition Fit)";
            const maxInterference = Math.abs(minClearance); // 죔새의 최댓값
            fitDetail = `최대 틈새: ${maxClearance.toFixed(3)} mm / 최대 죔새: ${maxInterference.toFixed(3)} mm`;
        }

        // 6. 브라우저 화면에 보기 좋게 결과 쏴주기!
        resultDiv.innerHTML = `
            <div style="background:#f9f9f9; padding:20px; border-radius:10px; border: 1px solid #ddd; line-height: 1.6;">
                <h3 style="margin-top:0; color:#333;">📊 조립 판별 결과 (기준치수: ${size}mm)</h3>
                <p><strong>🕳️ 구멍 공차 (${holeGrade}):</strong> 최댓값 ${holeMax.toFixed(3)}mm / 최솟값 ${holeMin.toFixed(3)}mm</p>
                <p><strong>🔨 축 공차 (${shaftGrade}):</strong> 최댓값 ${shaftMax.toFixed(3)}mm / 최솟값 ${shaftMin.toFixed(3)}mm</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
                <p style="font-size: 1.2rem; font-weight: bold; color: #0288d1;">${fitType}</p>
                <p style="color: #555; font-weight: 500;">${fitDetail}</p>
            </div>
        `;

    } else {
        resultDiv.innerHTML = "❌ 입력하신 치수 범위의 규격 데이터가 `toleranceData`에 없습니다.";
    }
});

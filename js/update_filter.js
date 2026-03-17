// 필요한 HTML 요소들을 미리 찾아둡니다.
const filterButtonsContainer = document.querySelector('.update-filters');
const updateItems = document.querySelectorAll('.update-item');

// 필터 버튼들이 있는 컨테이너에 클릭 이벤트를 추가합니다.
// 이렇게 하면 각 버튼에 이벤트를 다는 것보다 효율적입니다.
filterButtonsContainer.addEventListener('click', (event) => {
  // 클릭된 요소가 버튼이 아니면 아무것도 하지 않습니다.
  const clickedButton = event.target.closest('.update-filter-btn');
  if (!clickedButton) return;

  // 클릭된 버튼에서 필터링할 카테고리 이름을 가져옵니다. (예: 'achievement')
  const filterCategory = clickedButton.dataset.filter;

  // --- 1. 활성화된 버튼 스타일 업데이트 ---
  // 먼저 모든 버튼에서 'active' 클래스를 제거합니다.
  filterButtonsContainer.querySelectorAll('.update-filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  // 그리고 클릭된 버튼에만 'active' 클래스를 추가합니다.
  clickedButton.classList.add('active');

  // --- 2. 업데이트 목록 필터링 ---
  // 모든 업데이트 항목을 하나씩 확인합니다.
  updateItems.forEach(item => {
    const itemCategory = item.dataset.category;

    // 만약 필터가 'all'이거나, 아이템의 카테고리가 필터와 일치하면
    if (filterCategory === 'all' || itemCategory === filterCategory) {
      // 'hide' 클래스를 제거하여 화면에 보여줍니다.
      item.classList.remove('hide');
    } else {
      // 일치하지 않으면 'hide' 클래스를 추가하여 화면에서 숨깁니다.
      item.classList.add('hide');
    }
  });
});

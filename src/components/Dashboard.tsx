// Update dashboard blocks based on user role
const blocks = [];

if (['A', 'C'].includes(user.role)) {
  blocks.push({
    id: 'requests',
    icon: FileText,
    count: pendingRequests.length,
    title: 'Заявки на подпись',
    emptyText: 'Нет заявок на подпись',
    onClick: () => navigate('/requests')
  });
}

if (['A', 'B'].includes(user.role)) {
  blocks.push({
    id: 'tenders',
    icon: Box,
    count: activeTenders.length,
    title: 'Активные тендеры',
    emptyText: 'Нет активных тендеров',
    onClick: () => navigate('/tenders')
  });
}

// Add protocols block for everyone except Shohruh (role B)
if (user.role !== 'B') {
  blocks.push({
    id: 'protocols',
    icon: FileCheck,
    count: pendingProtocols.length,
    title: 'Протоколы на подпись',
    emptyText: 'Нет протоколов на подпись',
    onClick: () => navigate('/protocols')
  });
}

// Add archive block for everyone except Aziz (role C)
if (user.role !== 'C') {
  blocks.push({
    id: 'archive',
    icon: Archive,
    count: archivedProtocols.length,
    title: 'Архив протоколов',
    emptyText: 'Нет архивных протоколов',
    onClick: () => navigate('/archive')
  });
}
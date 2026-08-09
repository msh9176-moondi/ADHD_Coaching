export function WarningList({ coachees = [] }) {
  if (coachees.length === 0) {
    return (
      <div className="py-6 text-center text-gray-500">
        <p className="text-sm">주의가 필요한 피코치가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {coachees.map((coachee) => (
        <div
          key={coachee.id}
          className="p-3 rounded-lg bg-yellow-50"
        >
          <p className="font-medium text-yellow-800">
            {coachee.name}
          </p>
          <p className="text-sm text-yellow-600">
            {coachee.warningReason || '주의 필요'}
          </p>
        </div>
      ))}
    </div>
  )
}

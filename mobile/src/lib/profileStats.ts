export type ProfileReport = {
  id: string
  title: string
  category: string
  status: string
  submittedAt: Date
}

export const formatReportStatus = (status: string) => {
  if (status === 'Closed') {
    return 'Resolved'
  }
  if (status === 'Open') {
    return 'In Review'
  }
  return status
}

export const formatReportDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

export const formatAccountAge = (createdAt: string) => {
  const start = new Date(createdAt)
  if (Number.isNaN(start.getTime())) {
    return 'Unknown'
  }

  const now = new Date()
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 1) {
    return 'Less than a day'
  }
  if (diffDays === 1) {
    return '1 day'
  }
  if (diffDays < 30) {
    return `${diffDays} days`
  }

  const months = Math.floor(diffDays / 30)
  if (months < 12) {
    return months === 1 ? '1 month' : `${months} months`
  }

  const years = Math.floor(diffDays / 365)
  const remainingMonths = Math.floor((diffDays % 365) / 30)

  if (remainingMonths === 0) {
    return years === 1 ? '1 year' : `${years} years`
  }

  return `${years} year${years === 1 ? '' : 's'}, ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`
}

export const getProfileImpactStats = (reports: ProfileReport[]) => {
  const totalSubmitted = reports.length
  const resolved = reports.filter((report) => report.status === 'Closed').length

  return { totalSubmitted, resolved }
}

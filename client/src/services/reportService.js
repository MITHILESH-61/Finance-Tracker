import API from './api'

export const getMonthlyReport = (month, year) =>
  API.get('/reports/monthly', { params: { month, year } })

export const downloadMonthlyReport = (month, year) =>
  API.get('/reports/download', {
    params: { month, year },
    responseType: 'blob'
  })

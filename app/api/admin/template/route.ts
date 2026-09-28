import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
export const runtime='nodejs'
export async function GET(request:Request) {
  const course = new URL(request.url).searchParams.get('course')==='intermediate' ? 'intermediate':'foundation'
  const workbook=new ExcelJS.Workbook(); const sheet=workbook.addWorksheet(course==='foundation'?'Foundation':'Intermediate')
  sheet.addRow(['S NO','REGISTRATION NUMBER','STUDENT NAME','FATHER/HUSBAND NAME','DATE OF BIRTH','ADDRESS 1','ADDRESS 2','ADDRESS 3','CITY','PIN CODE','EMAIL ID','MOBILE NO'])
  sheet.getRow(1).font={bold:true}; sheet.columns.forEach(c=>{c.width=22})
  const buffer=await workbook.xlsx.writeBuffer()
  return new NextResponse(Buffer.from(buffer),{headers:{'content-type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','content-disposition':`attachment; filename="${course}-student-upload-template.xlsx"`}})
}

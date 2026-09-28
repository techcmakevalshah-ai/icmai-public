import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { requireAdmin } from '@/lib/supabase'
import { cleanDate, cleanPhone, cleanRegistration, cleanText } from '@/lib/normalize'
export const runtime='nodejs'; export const maxDuration=60
type RowData=Record<string,unknown>
const norm=(s:unknown)=>String(s??'').trim().toUpperCase().replace(/\s+/g,' ')
const alias:Record<string,string>={'S NO':'serial_no','REGISTRATION NUMBER':'registration_number','STUDENT NAME':'student_name','FATHER/HUSBAND NAME':'father_husband_name','DATE OF BIRTH':'date_of_birth','ADDRESS 1':'address_1','ADDRESS 2':'address_2','ADDRESS 3':'address_3','CITY':'city','PIN CODE':'pin_code','PINCODE':'pin_code','EMAIL ID':'email','EMAILID':'email','MOBILE NO':'mobile','MOBILENO':'mobile'}
export async function POST(request:Request){
  const auth=await requireAdmin(request); if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status})
  try{
    const fd=await request.formData(); const course=String(fd.get('course')||'').toLowerCase(); const confirmation=String(fd.get('confirmation')||'').toLowerCase().trim(); const file=fd.get('file')
    if(!['foundation','intermediate'].includes(course))return NextResponse.json({error:'Choose Foundation or Intermediate.'},{status:400})
    if(confirmation!==course)return NextResponse.json({error:`Type ${course} exactly to confirm.`},{status:400})
    if(!(file instanceof File))return NextResponse.json({error:'Excel file is required.'},{status:400})
    const wb=new ExcelJS.Workbook(); await wb.xlsx.load(await file.arrayBuffer()); const ws=wb.worksheets[0]; if(!ws)return NextResponse.json({error:'Workbook has no worksheet.'},{status:400})
    const headers:string[]=[]; ws.getRow(1).eachCell((cell,col)=>{headers[col]=norm(cell.value)}); const rows:RowData[]=[]
    ws.eachRow((r,rowNumber)=>{if(rowNumber===1)return; const raw:RowData={}; r.eachCell({includeEmpty:true},(cell,col)=>{const key=alias[headers[col]];if(key)raw[key]=cell.value instanceof Date?cell.value:cell.text})
      const reg=cleanRegistration(raw.registration_number); const name=cleanText(raw.student_name); if(!reg||!name)return
      rows.push({course,serial_no:Number(String(raw.serial_no||'').replace(/\D/g,''))||null,registration_number:reg,student_name:name.toUpperCase(),father_husband_name:cleanText(raw.father_husband_name).toUpperCase()||null,date_of_birth:cleanDate(raw.date_of_birth),address_1:cleanText(raw.address_1).toUpperCase()||null,address_2:cleanText(raw.address_2).toUpperCase()||null,address_3:cleanText(raw.address_3).toUpperCase()||null,city:cleanText(raw.city).toUpperCase()||null,pin_code:cleanText(raw.pin_code)||null,email:cleanText(raw.email).toUpperCase()||null,mobile:cleanPhone(raw.mobile)||null,updated_at:new Date().toISOString()})
    })
    const unique=[...new Map(rows.map(r=>[String(r.registration_number),r])).values()]; if(!unique.length)return NextResponse.json({error:'No valid student rows found.'},{status:400}); if(unique.length>5000)return NextResponse.json({error:'Maximum 5,000 rows per upload.'},{status:400})
    for(let i=0;i<unique.length;i+=500){const {error}=await auth.supabase.from('students').upsert(unique.slice(i,i+500),{onConflict:'registration_number'});if(error)throw error}
    return NextResponse.json({processed:unique.length})
  }catch(e){console.error('admin_upload_error',e);return NextResponse.json({error:'Unable to process this Excel file.'},{status:500})}
}

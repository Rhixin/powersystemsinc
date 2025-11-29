import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const formData = await request.formData();

    // Helper to safely get string values
    const getString = (key: string) => formData.get(key) as string || '';

    // Extract fields
    const reporting_person_name = getString('reporting_person_name');
    const telephone_fax = getString('telephone_fax');
    const equipment_manufacturer = getString('equipment_manufacturer');
    const report_date = getString('report_date');
    const customer_name = getString('customer_name');
    const contact_person = getString('contact_person');
    const address = getString('address');
    const email_address = getString('email_address');
    const engine_model = getString('engine_model');
    const engine_serial_no = getString('engine_serial_no');
    const alternator_brand_model = getString('alternator_brand_model');
    const equipment_model = getString('equipment_model');
    const equipment_serial_no = getString('equipment_serial_no');
    const alternator_serial_no = getString('alternator_serial_no');
    const location = getString('location');
    const date_in_service = getString('date_in_service');
    const rating = getString('rating');
    const revolution = getString('revolution');
    const starting_voltage = getString('starting_voltage');
    const running_hours = getString('running_hours');
    const fuel_pump_serial_no = getString('fuel_pump_serial_no');
    const fuel_pump_code = getString('fuel_pump_code');
    const lube_oil_type = getString('lube_oil_type');
    const fuel_type = getString('fuel_type');
    const cooling_water_additives = getString('cooling_water_additives');
    const date_failed = getString('date_failed');
    const turbo_model = getString('turbo_model');
    const turbo_serial_no = getString('turbo_serial_no');
    const customer_complaint = getString('customer_complaint');
    const possible_cause = getString('possible_cause');
    const within_coverage_period = getString('within_coverage_period');
    const warrantable_failure = getString('warrantable_failure');
    const summary_details = getString('summary_details');
    const service_technician = getString('service_technician');
    const approved_by = getString('approved_by');
    const acknowledged_by = getString('acknowledged_by');
    const action_taken = getString('action_taken');
    const observation = getString('observation');
    const findings = getString('findings');
    const recommendations = getString('recommendations');
    
    // Handle Attachment Upload
    let attachmentUrl: string | null = null;
    const attachmentFile = formData.get('attachments') as File | null;

    if (attachmentFile && attachmentFile.size > 0) {
      const filename = `deutz/${Date.now()}-${attachmentFile.name.replace(/\s/g, '_')}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('service-reports')
        .upload(filename, attachmentFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        // Continue, but maybe log specific RLS errors if they persist (though service role should fix RLS)
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('service-reports')
          .getPublicUrl(filename);
        
        attachmentUrl = publicUrlData.publicUrl;
      }
    }

    // Generate Job Order No.
    const { count, error: countError } = await supabase
      .from('deutz_service_report')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching record count:', countError);
      return NextResponse.json({ error: 'Failed to generate Job Order No.' }, { status: 500 });
    }

    const currentYear = new Date().getFullYear();
    const nextSequence = (count || 0) + 1;
    const generatedJobOrder = `DEUTZ-SVC-${currentYear}-${nextSequence.toString().padStart(4, '0')}`;

    // Insert into Database
    const { data, error } = await supabase
      .from('deutz_service_report')
      .insert([
        {
          reporting_person_name,
          telephone_fax,
          equipment_manufacturer,
          job_order: generatedJobOrder,
          report_date,
          customer_name,
          contact_person,
          address,
          email_address,
          engine_model,
          engine_serial_no,
          alternator_brand_model,
          equipment_model,
          equipment_serial_no,
          alternator_serial_no,
          location,
          date_in_service,
          rating,
          revolution,
          starting_voltage,
          running_hours,
          fuel_pump_serial_no,
          fuel_pump_code,
          lube_oil_type,
          fuel_type,
          cooling_water_additives,
          date_failed,
          turbo_model,
          turbo_serial_no,
          customer_complaint,
          possible_cause,
          within_coverage_period,
          warrantable_failure,
          summary_details,
          service_technician,
          approved_by,
          acknowledged_by,
          action_taken,
          observation,
          findings,
          recommendations,
          attachments: attachmentUrl ? [attachmentUrl] : [],
        },
      ])
      .select();

    if (error) {
      console.error('Error inserting data:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Service Report submitted successfully', data }, { status: 201 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
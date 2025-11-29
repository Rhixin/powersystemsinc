import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Extract fields matching the database schema
    const {
      reporting_person_name,
      telephone_fax,
      equipment_name,
      running_hours,
      customer_name,
      contact_person,
      address,
      email_address,
      commissioning_location,
      commissioning_date,
      engine_model,
      engine_serial_no,
      commissioning_no,
      equipment_manufacturer,
      equipment_no,
      equipment_type,
      output,
      revolutions,
      main_effective_pressure,
      lube_oil_type,
      fuel_type,
      cooling_water_additives,
      fuel_pump_serial_no,
      fuel_pump_code,
      turbo_model,
      turbo_serial_no,
      summary,
      check_oil_level,
      check_air_filter,
      check_hoses_clamps,
      check_engine_support,
      check_v_belt,
      check_water_level,
      crankshaft_end_play,
      inspector,
      comments_action,
      rpm_idle_speed,
      rpm_full_speed,
      oil_pressure_idle,
      oil_pressure_full,
      oil_temperature,
      engine_smoke,
      engine_vibration,
      check_engine_leakage,
      cylinder_head_temp,
      cylinder_no,
      cylinder_a1,
      cylinder_a2,
      cylinder_a3,
      cylinder_a4,
      cylinder_a5,
      cylinder_a6,
      cylinder_b1,
      cylinder_b2,
      cylinder_b3,
      cylinder_b4,
      cylinder_b5,
      cylinder_b6,
      starter_part_no,
      alternator_part_no,
      v_belt_part_no,
      air_filter_part_no,
      oil_filter_part_no,
      fuel_filter_part_no,
      pre_fuel_filter_part_no,
      controller_brand,
      controller_model,
      remarks,
      recommendation,
      attending_technician,
      approved_by,
      acknowledged_by,
    } = body;

    // Generate Job Order No.
    const { count, error: countError } = await supabase
      .from('deutz_commissioning_report')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching record count:', countError);
      return NextResponse.json({ error: 'Failed to generate Job Order No.' }, { status: 500 });
    }

    const currentYear = new Date().getFullYear();
    const nextSequence = (count || 0) + 1;
    const generatedJobOrderNo = `JO-${currentYear}-${nextSequence.toString().padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('deutz_commissioning_report')
      .insert([
        {
          reporting_person_name,
          telephone_fax,
          equipment_name,
          running_hours,
          customer_name,
          contact_person,
          address,
          email_address,
          commissioning_location,
          job_order_no: generatedJobOrderNo,
          commissioning_date,
          engine_model,
          engine_serial_no,
          commissioning_no,
          equipment_manufacturer,
          equipment_no,
          equipment_type,
          output,
          revolutions,
          main_effective_pressure,
          lube_oil_type,
          fuel_type,
          cooling_water_additives,
          fuel_pump_serial_no,
          fuel_pump_code,
          turbo_model,
          turbo_serial_no,
          summary,
          check_oil_level,
          check_air_filter,
          check_hoses_clamps,
          check_engine_support,
          check_v_belt,
          check_water_level,
          crankshaft_end_play,
          inspector,
          comments_action,
          rpm_idle_speed,
          rpm_full_speed,
          oil_pressure_idle,
          oil_pressure_full,
          oil_temperature,
          engine_smoke,
          engine_vibration,
          check_engine_leakage,
          cylinder_head_temp,
          cylinder_no,
          cylinder_a1,
          cylinder_a2,
          cylinder_a3,
          cylinder_a4,
          cylinder_a5,
          cylinder_a6,
          cylinder_b1,
          cylinder_b2,
          cylinder_b3,
          cylinder_b4,
          cylinder_b5,
          cylinder_b6,
          starter_part_no,
          alternator_part_no,
          v_belt_part_no,
          air_filter_part_no,
          oil_filter_part_no,
          fuel_filter_part_no,
          pre_fuel_filter_part_no,
          controller_brand,
          controller_model,
          remarks,
          recommendation,
          attending_technician,
          approved_by,
          acknowledged_by,
        },
      ])
      .select();

    if (error) {
      console.error('Error inserting data:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Report submitted successfully', data }, { status: 201 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

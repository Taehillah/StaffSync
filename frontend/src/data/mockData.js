export const mockUsers = [
  {
    user_id: 1,
    username: 'jdoe',
    password_hash: 'hashed_password_123',
    email: 'john.doe@saaf.mil',
    iter_level: 3,
    mustering_code: 'P',
    last_login: '2025-06-08T14:30:00Z',
    is_active: true,
    force_number: '90119292MI'
  },
  {
    user_id: 2,
    username: 'asmith',
    password_hash: 'hashed_password_456',
    email: 'anna.smith@saaf.mil',
    iter_level: 2,
    mustering_code: 'C2',
    last_login: '2025-06-09T09:15:00Z',
    is_active: true,
    force_number: '01020344MC'
  },
  {user_id: 3,
  username: 'emokoena',
  password_hash: 'hashed_password_345',
  email: 'esia.mokoena@saaf.mil',
  iter_level: 3,
  mustering_code: 'P',
  last_login: '2025-06-08T14:30:00Z',
  is_active: true,
  force_number: '01020033MI'
},
{user_id: 4,
username: '',
password_hash: 'hashed_password_158',
email: 'eric.tola@saaf.mil',
iter_level: 3,
mustering_code: 'P',
last_login: '2025-06-08T14:30:00Z',
is_active: true,
force_number: '98045679MC'
}
];

export const mockMembers = [
  {
    member_id: 1,
    force_number: '90119292MI',
    suffix: 'Mr',
    rank: 'Captain',
    first_name: 'John',
    middle_names: 'William',
    surname: 'Doe',
    id_number: '8001015009087',
    mustering_code: 'P',
    unit_id: 1,
    cell_number: '+27821234567',
    work_tel: '0123456001',
    email: 'john.doe@saaf.mil',
    security_dearance: 'Secret',
    post_description: 'Pilot',
    service_type: 'Permanent Force',
    is_deployable: true,
    is_area_bound: false,
    current_whereabouts: 'Base HQ',
    is_registered_for_studies: true,
    created_at: '2020-01-15T00:00:00Z',
    updated_at: '2025-05-20T00:00:00Z'
  },
  {
    member_id: 2,
    force_number: '01020344MC',
    suffix: 'Ms',
    rank: 'Major',
    first_name: 'Anna',
    middle_names: 'Marie',
    surname: 'Smith',
    id_number: '8505054005086',
    mustering_code: 'C2',
    unit_id: 2,
    cell_number: '+27827654321',
    work_tel: '0123456002',
    email: 'anna.smith@saaf.mil',
    security_dearance: 'Top Secret',
    post_description: 'Command Officer',
    service_type: 'Permanent Force',
    is_deployable: true,
    is_area_bound: false,
    current_whereabouts: 'Command Center',
    is_registered_for_studies: false,
    created_at: '2018-06-10T00:00:00Z',
    updated_at: '2025-04-15T00:00:00Z'
  },
  {
    member_id: 3,
    force_number: '01020033MI',
    suffix: 'Mr',
    rank: 'Corporal',
    first_name: 'Esia',
    middle_names: 'Rod',
    surname: 'Mokoena',
    id_number: '8801015009087',
    mustering_code: 'P',
    unit_id: 1,
    cell_number: '+27834234567',
    work_tel: '0123456001',
    email: 'esia.mokoena@saaf.mil',
    security_dearance: 'Secret',
    post_description: 'Pilot',
    service_type: 'Permanent Force',
    is_deployable: true,
    is_area_bound: false,
    current_whereabouts: 'Base HQ',
    is_registered_for_studies: true,
    created_at: '2020-01-15T00:00:00Z',
    updated_at: '2025-05-20T00:00:00Z'
  },
  {
    member_id: 4,
    force_number: '98045679M',
    suffix: 'Mr',
    rank: 'Captain',
    first_name: 'Eric',
    middle_names: 'Goft',
    surname: 'Tola',
    id_number: '8001015009087',
    mustering_code: 'P',
    unit_id: 1,
    cell_number: '+27821234567',
    work_tel: '0123456001',
    email: 'eric.tola@saaf.mil',
    security_dearance: 'Secret',
    post_description: 'Pilot',
    service_type: 'Permanent Force',
    is_deployable: true,
    is_area_bound: false,
    current_whereabouts: 'Base HQ',
    is_registered_for_studies: true,
    created_at: '2020-01-15T00:00:00Z',
    updated_at: '2025-05-20T00:00:00Z'
  },
];

export const mockWorkDetails = [
  {
    work_id: 1,
    member_id: 1,
    employment_type: 'Full-time',
    contract_start: '2020-02-01',
    contract_end: '2025-01-31',
    course_nominated: 'Advanced Flight Training',
    course_date: '2025-07-15',
    competency_renewal: '2025-12-31',
    base_id: 1
  },
  {
    work_id: 2,
    member_id: 2,
    employment_type: 'Full-time',
    contract_start: '2018-07-01',
    contract_end: '2026-06-30',
    course_nominated: 'Strategic Command Course',
    course_date: '2025-09-10',
    competency_renewal: '2026-06-30',
    base_id: 2
  },
  {
    work_id: 3,
    member_id: 1,
    employment_type: 'Full-time',
    contract_start: '2020-02-01',
    contract_end: '2025-01-31',
    course_nominated: 'NCOs',
    course_date: '2025-07-15',
    competency_renewal: '2025-12-31',
    base_id: 1
  },
  {
    work_id: 4,
    member_id: 1,
    employment_type: 'Full-time',
    contract_start: '2020-02-01',
    contract_end: '2025-01-31',
    course_nominated: 'Advanced Flight Training',
    course_date: '2025-07-15',
    competency_renewal: '2025-12-31',
    base_id: 1
  },
];

export const mockMusterings = [
  {
    code: 'P',
    name: 'Pilot',
    description: 'Flight operations personnel'
  },
  {
    code: 'C2',
    name: 'Command and Control',
    description: 'Strategic command personnel'
  },
  {
    code: 'SS',
    name: 'Supply Support',
    description: 'Logistics'
  }
];

export const mockUnits = [
  {
    unit_id: 1,
    mustering_code: 'P',
    name: '17 Squadron',
    base_id: 1
  },
  {
    unit_id: 2,
    mustering_code: 'C2',
    name: 'Command and Control School',
    base_id: 2
  }
];

export const mockBases = [
  {
    base_id: 1,
    name: 'AFB Waterkloof',
    city: 'Pretoria',
    province: 'Gauteng',
    contact_number: '0126541000'
  },
  {
    base_id: 2,
    name: 'AFB Swartkop',
    city: 'Pretoria',
    province: 'Gauteng',
    contact_number: '0126542000'
  },
  {
    base_id: 3,
    name: 'AFB Bloemspruit',
    city: 'Bloemfontein',
    province: 'Free State',
    contact_number: '0516542000'
  }

];

export const mockCombatReadiness = [
  {
    readiness_id: 1,
    member_id: 1,
    dd50_status: 'Complete',
    dd28_status: 'Complete',
    passport_status: 'Valid',
    passport_expiry: '2027-05-15',
    immunizations_status: 'Current',
    doc_tag_status: 'Complete',
    will_status: 'Complete',
    beneficiaries_status: 'Complete',
    musketry_status: 'Qualified',
    fitness_status: 'Pass',
    overall_status: 'Ready',
    status_reason: null,
    last_assessed: '2025-05-15T00:00:00Z',
    assessed_by: 2
  },
  {
    readiness_id: 2,
    member_id: 2,
    dd50_status: 'Complete',
    dd28_status: 'Complete',
    passport_status: 'Valid',
    passport_expiry: '2028-03-20',
    immunizations_status: 'Current',
    doc_tag_status: 'Complete',
    will_status: 'Complete',
    beneficiaries_status: 'Complete',
    musketry_status: 'Qualified',
    fitness_status: 'Pass',
    overall_status: 'Ready',
    status_reason: null,
    last_assessed: '2025-05-18T00:00:00Z',
    assessed_by: 1
  },
  {
    readiness_id: 3,
    member_id: 3,
    dd50_status: 'Complete',
    dd28_status: 'Complete',
    passport_status: 'Valid',
    passport_expiry: '2028-03-20',
    immunizations_status: 'Current',
    doc_tag_status: 'Complete',
    will_status: 'Complete',
    beneficiaries_status: 'Complete',
    musketry_status: 'Qualified',
    fitness_status: 'Pass',
    overall_status: 'Ready',
    status_reason: null,
    last_assessed: '2025-05-18T00:00:00Z',
    assessed_by: 1
  },
  {
    readiness_id: 4,
    member_id: 4,
    dd50_status: 'Complete',
    dd28_status: 'Complete',
    passport_status: 'Valid',
    passport_expiry: '2028-03-20',
    immunizations_status: 'Current',
    doc_tag_status: 'Complete',
    will_status: 'Complete',
    beneficiaries_status: 'Complete',
    musketry_status: 'Qualified',
    fitness_status: 'Pass',
    overall_status: 'Ready',
    status_reason: null,
    last_assessed: '2025-05-18T00:00:00Z',
    assessed_by: 1
  }
];

export const mockDependents = [
  {
    dependent_id: 1,
    member_id: 1,
    full_name: 'Sarah Doe',
    relationship: 'Spouse',
    date_of_birth: '1985-08-20',
    is_beneficiary: true
  },
  {
    dependent_id: 2,
    member_id: 1,
    full_name: 'Michael Doe',
    relationship: 'Child',
    date_of_birth: '2015-03-12',
    is_beneficiary: true
  },
  {
    dependent_id: 3,
    member_id: 3,
    full_name: 'Lerato Mokoena',
    relationship: 'Child',
    date_of_birth: '2015-03-12',
    is_beneficiary: true
  },
  {
    dependent_id: 4,
    member_id: 4,
    full_name: 'Mpho Tola',
    relationship: 'Child',
    date_of_birth: '2015-03-12',
    is_beneficiary: true
  }
];




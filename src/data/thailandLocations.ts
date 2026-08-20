export interface ThailandLocation {
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
}

// Full Thai administrative hierarchy is fetched once and cached locally.
export const THAI_GEO_URL = 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/province_with_district_and_sub_district.json';
export const THAI_GEO_CACHE_KEY = 'som.thai-geo.v1';

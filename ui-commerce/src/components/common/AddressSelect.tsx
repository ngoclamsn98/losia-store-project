'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Province {
  id: number;
  name: string;
}

interface District {
  id: number;
  name: string;
}

interface Ward {
  id: number;
  name: string;
}

interface AddressSelectProps {
  provinceValue: string;
  districtValue: string;
  wardValue: string;
  onProvinceChange: (value: string, id: number) => void;
  onDistrictChange: (value: string, id: number) => void;
  onWardChange: (value: string, id: number) => void;
  required?: boolean;
}

export default function AddressSelect({
  provinceValue,
  districtValue,
  wardValue,
  onProvinceChange,
  onDistrictChange,
  onWardChange,
  required = false,
}: AddressSelectProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      const response = await fetch(`${API_URL}/viettel-post/provinces`);
      const data = await response.json();
      if (data.success) {
        setProvinces(data.data);
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  const fetchDistricts = async (provinceId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/viettel-post/districts?provinceId=${provinceId}`);
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWards = async (districtId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/viettel-post/wards?districtId=${districtId}`);
      const data = await response.json();
      if (data.success) {
        setWards(data.data);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const province = provinces.find(p => p.id === selectedId);
    
    if (province) {
      setSelectedProvinceId(selectedId);
      onProvinceChange(province.name, selectedId);
      
      // Reset district and ward
      setDistricts([]);
      setWards([]);
      setSelectedDistrictId(null);
      onDistrictChange('', 0);
      onWardChange('', 0);
      
      // Fetch districts
      fetchDistricts(selectedId);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const district = districts.find(d => d.id === selectedId);
    
    if (district) {
      setSelectedDistrictId(selectedId);
      onDistrictChange(district.name, selectedId);
      
      // Reset ward
      setWards([]);
      onWardChange('', 0);
      
      // Fetch wards
      fetchWards(selectedId);
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const ward = wards.find(w => w.id === selectedId);
    
    if (ward) {
      onWardChange(ward.name, selectedId);
    }
  };

  return (
    <>
      <div className="ui-floating u-flex-1">
        <select
          value={selectedProvinceId || ''}
          onChange={handleProvinceChange}
          className="ui-input u-mb-0"
          required={required}
        >
          <option value="">Chọn Tỉnh/Thành phố</option>
          {provinces.map(province => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
        <label>Tỉnh/Thành phố{required && '*'}</label>
      </div>

      <div className="ui-floating u-flex-1">
        <select
          value={selectedDistrictId || ''}
          onChange={handleDistrictChange}
          className="ui-input u-mb-0"
          disabled={!selectedProvinceId || loading}
          required={required}
        >
          <option value="">Chọn Quận/Huyện</option>
          {districts.map(district => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
        <label>Quận/Huyện{required && '*'}</label>
      </div>

      <div className="ui-floating u-flex-1">
        <select
          value={wardValue}
          onChange={handleWardChange}
          className="ui-input u-mb-0"
          disabled={!selectedDistrictId || loading}
        >
          <option value="">Chọn Phường/Xã</option>
          {wards.map(ward => (
            <option key={ward.id} value={ward.id}>
              {ward.name}
            </option>
          ))}
        </select>
        <label>Phường/Xã</label>
      </div>
    </>
  );
}


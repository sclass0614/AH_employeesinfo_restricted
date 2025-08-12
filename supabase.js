let supabaseClient;

function initSupabase() {
  const supabaseUrl = "https://abjftkkqxezmptfwznuc.supabase.co";
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiamZ0a2txeGV6bXB0Znd6bnVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0OTEzNjcsImV4cCI6MjA1MjA2NzM2N30.JC13lQDNXvUWj5a7o3YNVj1XcbOFwCYKoMXC1n4vUHM";

  supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
}

async function getData_All() {
  try {
    const { data, error } = await supabaseClient
      .from("AH_EmployeesInfo")
      .select("*");

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw new Error(`데이터 조회 실패: ${error.message}`);
  }
}

async function processEmployeeFormData(formData) {
  const convertDateToInt = (dateStr) => {
    if (!dateStr) return null;

    if (typeof dateStr === "string" && dateStr.includes("-")) {
      return parseInt(dateStr.replace(/-/g, ""));
    } else if (typeof dateStr === "string" && /^\d{8}$/.test(dateStr)) {
      return parseInt(dateStr);
    }

    return null;
  };

  const workdaysString = Array.isArray(formData.workdays)
    ? formData.workdays.join("_")
    : formData.workdays || "";

  const employeeData = {
    직원번호: formData.employeeId === "신규직원등록중" ? null : formData.employeeId,
    직원명: formData.name,
    주민등록번호: formData.ssn,
    생년월일: convertDateToInt(formData.birthdate),
    만나이: formData.age,
    주소: formData.address,
    이메일: formData.email,
    휴대전화번호: formData.mobile,
    전화번호: formData.phone,
    비상연락망: formData.emergency,
    근무구분: formData.workType,
    담당직종: formData.position,
    계약일: convertDateToInt(formData.contractDate),
    계약시작일: convertDateToInt(formData.contractStart),
    계약종료일: convertDateToInt(formData.contractEnd),
    근무시작시간: formData.workStart,
    근무종료시간: formData.workEnd,
    휴게시간: formData.breakTime,
    근무요일: workdaysString,
    일일근무시간: formData.dailyHours,
    기타근무유형: formData.otherWorkType,
    건강검진일: convertDateToInt(formData.healthCheckupDate),
    범죄경력조회일: convertDateToInt(formData.criminalRecordDate),
    치매교육이수일: convertDateToInt(formData.dementiaTrainingDate),
    계좌번호: formData.bankAccount,
    계좌은행: formData.bankName,
    예금주: formData.accountHolder,
  };

  if (!employeeData.직원번호) {
    const newEmployeeId = await generateEmployeeIdServer();
    employeeData.직원번호 = newEmployeeId;
  }

  return appendEmployeeLine(employeeData);
}

async function appendEmployeeLine(data) {
  try {
    const { data: result, error } = await supabaseClient
      .from("AH_EmployeesInfo")
      .insert(data)
      .select();

    if (error) {
      throw error;
    }

    if (result && result.length > 0) {
      return {
        success: true,
        message: "직원 정보가 성공적으로 저장되었습니다.",
        employeeId: result[0].직원번호,
        data: result[0],
      };
    } else {
      return {
        success: false,
        message: "직원 정보 저장에 실패했습니다.",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `직원 정보 저장 중 오류가 발생했습니다: ${error.message}`,
    };
  }
}

async function generateEmployeeIdServer() {
  try {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const prefix = "S" + currentYear;

    const { data, error } = await supabaseClient
      .from("AH_EmployeesInfo")
      .select("직원번호")
      .like("직원번호", `${prefix}%`);

    if (error) {
      throw error;
    }

    let maxNumber = 0;

    if (data && data.length > 0) {
      data.forEach((row) => {
        const employeeId = row.직원번호;
        if (employeeId && employeeId.startsWith(prefix)) {
          const numberPart = parseInt(employeeId.substring(3), 10);
          if (!isNaN(numberPart) && numberPart > maxNumber) {
            maxNumber = numberPart;
          }
        }
      });
    }

    const nextNumber = (maxNumber + 1).toString().padStart(3, "0");
    return prefix + nextNumber;
  } catch (error) {
    throw new Error(`직원번호 생성 실패: ${error.message}`);
  }
}

async function move_EmployeeLine(employeeId) {
  try {
    const { data: employeeData, error: selectError } = await supabaseClient
      .from("AH_EmployeesInfo")
      .select("*")
      .eq("직원등록_id", employeeId)
      .single();

    if (selectError) {
      throw selectError;
    }

    if (!employeeData) {
      return {
        success: false,
        message: "삭제할 직원 정보를 찾을 수 없습니다.",
      };
    }

    const { error: insertError } = await supabaseClient
      .from("OUTDATED_AH_EmployeesInfo")
      .insert(employeeData);

    if (insertError) {
      throw insertError;
    }

    const { error: deleteError } = await supabaseClient
      .from("AH_EmployeesInfo")
      .delete()
      .eq("직원등록_id", employeeId);

    if (deleteError) {
      throw deleteError;
    }

    return {
      success: true,
      message: "직원 정보가 성공적으로 삭제되었습니다.",
    };
  } catch (error) {
    return {
      success: false,
      message: `직원 정보 삭제 중 오류가 발생했습니다: ${error.message}`,
    };
  }
}

async function getData_Cert() {
  try {
    const { data, error } = await supabaseClient
      .from("AH_CertificatesInfo")
      .select("*");

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw new Error(`자격증 데이터 조회 실패: ${error.message}`);
  }
}

async function processCertFormData(formData) {
  const convertDateToInt = (dateStr) => {
    if (!dateStr) return null;

    if (typeof dateStr === "string" && dateStr.includes("-")) {
      return parseInt(dateStr.replace(/-/g, ""));
    } else if (typeof dateStr === "string" && /^\d{8}$/.test(dateStr)) {
      return parseInt(dateStr);
    }

    return null;
  };

  const certData = {
    직원번호: formData.employeeId,
    직원명: formData.employeeName,
    자격증명: formData.certName,
    자격번호: formData.certNumber,
    자격증취득일: convertDateToInt(formData.certDate),
    자격증만료일: convertDateToInt(formData.certExpiryDate),
    자격증발행처: formData.certIssuer,
  };

  return appendCertLine(certData);
}

async function appendCertLine(data) {
  try {
    const { data: result, error } = await supabaseClient
      .from("AH_CertificatesInfo")
      .insert(data)
      .select();

    if (error) {
      throw error;
    }

    if (result && result.length > 0) {
      return {
        success: true,
        message: "자격증 정보가 성공적으로 저장되었습니다.",
        data: result[0],
      };
    } else {
      return {
        success: false,
        message: "자격증 정보 저장에 실패했습니다.",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `자격증 정보 저장 중 오류가 발생했습니다: ${error.message}`,
    };
  }
}

async function deleteCertData_Supabase(certId) {
  try {
    const { error } = await supabaseClient
      .from("AH_CertificatesInfo")
      .delete()
      .eq("자격등록_id", certId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: "자격증 정보가 성공적으로 삭제되었습니다.",
    };
  } catch (error) {
    return {
      success: false,
      message: `자격증 정보 삭제 중 오류가 발생했습니다: ${error.message}`,
    };
  }
}
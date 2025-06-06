import React, { useEffect, useState } from "react";
import AdminHeader from "./AdminHeader";
import { getEventList } from "../../api/starsApi";
import { Menu, Grid, ChevronLeft, ChevronRight } from "lucide-react";

interface TourList {
    category: string;
    gu: string;
    event_name: string;
    start_date: string;
    end_date: string;
    is_free: boolean;
    event_fee?: string;
}

interface GetTourList {
    category: string;
    address: string;
    event_name: string;
    start_date: string;
    end_date: string;
    event_fee: string;
}

const marqueeStyle = `
@keyframes marquee {
    0% { 
        transform: translateX(100%); 
    }
    100% { 
        transform: translateX(-100%); 
    }
}

.animate-marquee {
    animation: marquee 12s linear infinite;
    display: inline-block;
}

.animate-marquee:hover {
    animation-play-state: paused;
}

/* 짧은 제목은 애니메이션 안함 */
.no-marquee {
    animation: none !important;
}
`;

if (
    typeof document !== "undefined" &&
    !document.getElementById("marquee-styles")
) {
    const style = document.createElement("style");
    style.id = "marquee-styles";
    style.textContent = marqueeStyle;
    document.head.appendChild(style);
}

const AdminTour = () => {
    const [list, setList] = useState<TourList[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>("");
    const [filterFeeType, setFilterFeeType] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedEvent, setSelectedEvent] = useState<TourList | null>(null);
    const [isMobileView, setIsMobileView] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);

    // 화면 크기 체크
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobileView(window.innerWidth < 768);
            // 모바일에서는 자동으로 그리드 모드로 변경
            if (window.innerWidth < 768) {
                setViewMode("grid");
            }
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    // 데이터 로드 함수
    const fetchEvents = async () => {
        setLoading(true);
        setError(null);

        try {
            const response: GetTourList[] = await getEventList();

            if (response && response.length > 0) {
                const tourData: TourList[] = response.map((e) => ({
                    category: e.category,
                    gu: e.address,
                    event_name: e.event_name,
                    start_date: e.start_date,
                    end_date: e.end_date,
                    is_free: e.event_fee === "" || e.event_fee === "무료",
                    event_fee: e.event_fee,
                }));

                setList(tourData);
            } else {
                setError("이벤트 데이터가 비어있거나 정의되지 않았습니다.");
            }
        } catch (err) {
            console.error(err);
            setError("문화 행사 데이터를 불러오는데 실패했습니다.");
            setList([]);
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (viewMode === "grid") {
            setItemsPerPage(9);
        } else {
            setItemsPerPage(10);
        }
        setCurrentPage(1); // 페이지도 1로 리셋
    }, [viewMode]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterCategory, filterFeeType, searchTerm]);

    // 필터링 로직
    const filteredList = list.filter((item) => {
        const matchesCategory = filterCategory
            ? item.category === filterCategory
            : true;
        const matchesFeeType = filterFeeType
            ? filterFeeType === "free"
                ? item.is_free
                : !item.is_free
            : true;
        const matchesSearch = searchTerm
            ? item.event_name.toLowerCase().includes(searchTerm.toLowerCase())
            : true;

        return matchesCategory && matchesFeeType && matchesSearch;
    });

    // 필터 계산 후 페이징
    const totalPages = Math.ceil(filteredList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedList = filteredList.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    // 이벤트 선택 핸들러
    const handleEventClick = (event: TourList) => {
        setSelectedEvent(event);
    };

    // 모달 닫기 핸들러
    const closeModal = () => {
        setSelectedEvent(null);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // 제목 길이 체크 함수
    const shouldUseMarquee = (text: string) => {
        if (isMobileView) {
            return text.length > 20;
        }
        return text.length > 54; // 20자 이상일 때만 마퀴 효과
    };

    // Esc 키로 모달 닫기 기능
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === "Escape" && selectedEvent) {
                closeModal();
            }
        };

        window.addEventListener("keydown", handleEscKey);
        return () => {
            window.removeEventListener("keydown", handleEscKey);
        };
    }, [selectedEvent]);

    // 고유한 카테고리 목록 추출
    const categories = Array.from(new Set(list.map((item) => item.category)));

    // 날짜 포맷팅 함수
    const formatDate = (dateString: string) => {
        if (!dateString) return "날짜 없음";

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch (error) {
            console.error(error);
            return dateString;
        }
    };

    // 카테고리별 색상 반환
    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            음악: "bg-purple-100 text-purple-800 border-purple-300",
            공연: "bg-pink-100 text-pink-800 border-pink-300",
            전시: "bg-indigo-100 text-indigo-800 border-indigo-300",
            축제: "bg-orange-100 text-orange-800 border-orange-300",
            체험: "bg-green-100 text-green-800 border-green-300",
            기타: "bg-gray-100 text-gray-800 border-gray-300",
        };
        return colors[category] || colors["기타"];
    };

    // 상태별 배지 색상
    const getStatusColor = (isFree: boolean) => {
        return isFree
            ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-md shadow-emerald-100"
            : "bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-md shadow-red-100";
    };

    // 로딩 스켈레톤 컴포넌트
    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
                <div key={idx} className="animate-pulse">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-4 bg-gray-200 rounded-full w-20"></div>
                            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    // 그리드 뷰 컴포넌트
    const GridView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedList.map((item, index) => (
                <div
                    key={`${item.event_name}-${index}`}
                    className="bg-white rounded-md shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group"
                    onClick={() => handleEventClick(item)}
                >
                    {/* 상단 배지들 */}
                    <div className="flex justify-between items-center mb-2">
                        <span
                            className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getCategoryColor(item.category)}`}
                        >
                            {item.category}
                        </span>
                        <span
                            className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(item.is_free)}`}
                        >
                            {item.is_free ? "무료" : "유료"}
                        </span>
                    </div>

                    {/* 제목 */}
                    <div className="mb-2 h-6 overflow-hidden flex items-center relative">
                        {shouldUseMarquee(item.event_name) ? (
                            <>
                                {/* 마퀴 효과용 텍스트 (기본 상태) */}
                                <h3
                                    className="text-sm font-semibold text-gray-900 leading-tight whitespace-nowrap animate-marquee absolute group-hover:opacity-0 transition-opacity duration-300"
                                    style={{ animationDelay: "3s" }}
                                >
                                    {item.event_name}
                                </h3>
                                {/* hover시 보여질 정적 텍스트 */}
                                <h3 className="text-sm font-semibold text-gray-900 leading-tight w-full text-left truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {item.event_name}
                                </h3>
                            </>
                        ) : (
                            <h3 className="text-sm font-semibold text-gray-900 leading-tight w-full text-center">
                                {item.event_name}
                            </h3>
                        )}
                    </div>

                    {/* 정보 */}
                    <div className="space-y-0.5 text-xs text-gray-600">
                        <div className="flex items-center">
                            <svg
                                className="w-3 h-3 mr-1 text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>{item.gu}</span>
                        </div>
                        <div className="flex items-center">
                            <svg
                                className="w-3 h-3 mr-1 text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>
                                {formatDate(item.start_date)} ~{" "}
                                {formatDate(item.end_date)}
                            </span>
                        </div>
                    </div>

                    {/* 하단 액션 텍스트 */}
                    <div className="mt-2 pt-1 border-t border-gray-100">
                        <span
                            className={`text-xs font-medium ${
                                item.is_free
                                    ? "text-emerald-600"
                                    : "text-indigo-600"
                            }`}
                        >
                            {item.is_free ? "상세 정보 보기" : "요금 정보 보기"}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );

    // 테이블 뷰 컴포넌트
    const TableView = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-1 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider w-16">
                                카테고리
                            </th>
                            <th className="px-1 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                행사명
                            </th>
                            <th className="px-1 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider w-16">
                                지역
                            </th>
                            <th className="px-1 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider w-20">
                                기간
                            </th>
                            <th className="px-1 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider w-14">
                                요금
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedList.map((item, index) => (
                            <tr
                                key={`${item.event_name}-${index}`}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => handleEventClick(item)}
                            >
                                <td className="px-1 py-2 whitespace-nowrap w-16">
                                    <span
                                        className={`px-1 py-0.5 rounded text-xs font-semibold border ${getCategoryColor(item.category)} truncate block`}
                                        title={item.category}
                                    >
                                        {item.category}
                                    </span>
                                </td>
                                <td className="px-1 py-2 max-w-xs">
                                    <div
                                        className="text-sm font-medium text-gray-900 truncate"
                                        title={item.event_name}
                                    >
                                        {item.event_name}
                                    </div>
                                </td>
                                <td className="px-1 py-2 whitespace-nowrap text-sm text-gray-600 w-16">
                                    <div
                                        className="truncate text-xs"
                                        title={item.gu}
                                    >
                                        {item.gu}
                                    </div>
                                </td>
                                <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-600 w-20">
                                    <div
                                        title={`${formatDate(item.start_date)} ~ ${formatDate(item.end_date)}`}
                                    >
                                        <div className="truncate">
                                            {formatDate(item.start_date)}
                                        </div>
                                        <div className="text-gray-400 truncate">
                                            ~ {formatDate(item.end_date)}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-1 py-2 whitespace-nowrap w-14">
                                    <span
                                        className={`px-0.5 py-0.5 rounded text-xs font-semibold border ${getStatusColor(item.is_free)} truncate block text-center`}
                                    >
                                        {item.is_free ? "무료" : "유료"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const Pagination = () => {
        if (totalPages <= 1) return null;

        const getVisiblePages = () => {
            const delta = isMobileView ? 1 : 2; // 모바일에서는 더 적은 페이지 표시
            const range = [];
            const rangeWithDots = [];

            for (
                let i = Math.max(2, currentPage - delta);
                i <= Math.min(totalPages - 1, currentPage + delta);
                i++
            ) {
                range.push(i);
            }

            if (currentPage - delta > 2) {
                rangeWithDots.push(1, "...");
            } else {
                rangeWithDots.push(1);
            }

            rangeWithDots.push(...range);

            if (currentPage + delta < totalPages - 1) {
                rangeWithDots.push("...", totalPages);
            } else {
                rangeWithDots.push(totalPages);
            }

            return rangeWithDots;
        };

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-4">
                <div className="flex items-center justify-between">
                    {/* 페이지 정보 - 왼쪽 (데스크톱만) */}
                    {!isMobileView && (
                        <div className="text-right">
                            <div className="text-sm text-gray-700">
                                총{" "}
                                <span className="font-medium">
                                    {filteredList.length}
                                </span>
                                개 중{" "}
                                <span className="font-medium">
                                    {startIndex + 1}
                                </span>
                                -
                                <span className="font-medium">
                                    {Math.min(
                                        startIndex + itemsPerPage,
                                        filteredList.length
                                    )}
                                </span>
                                개 표시
                                {loading && (
                                    <span className="inline-flex items-center ml-2">
                                        <svg
                                            className="animate-spin h-4 w-4 text-indigo-500 mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        <span className="text-indigo-500 text-sm">
                                            로딩 중
                                        </span>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 페이지네이션 버튼들 */}
                    <div
                        className={`flex items-center gap-1 ${isMobileView ? "w-full justify-center" : "absolute left-1/2 transform -translate-x-1/2"}`}
                    >
                        {/* 이전 페이지 버튼 */}
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`${isMobileView ? "w-8 h-8" : "px-3 py-2"} text-sm font-medium rounded-lg transition-colors flex items-center justify-center ${
                                currentPage === 1
                                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            <ChevronLeft
                                className={`w-4 h-4 ${currentPage === 1 ? "text-gray-400" : "text-gray-700"}`}
                            />
                        </button>

                        {/* 페이지 번호들 */}
                        {getVisiblePages().map((page, index) => (
                            <React.Fragment key={index}>
                                {page === "..." ? (
                                    <span
                                        className={`${isMobileView ? "w-8 h-8" : "px-3 py-2"} text-sm text-gray-500 flex items-center justify-center`}
                                    >
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        onClick={() =>
                                            handlePageChange(page as number)
                                        }
                                        className={`${isMobileView ? "w-8 h-8" : "px-3 py-2"} text-sm font-medium rounded-lg transition-colors flex items-center justify-center ${
                                            currentPage === page
                                                ? "bg-indigo-500 text-white"
                                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                )}
                            </React.Fragment>
                        ))}

                        {/* 다음 페이지 버튼 */}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`${isMobileView ? "w-8 h-8" : "px-3 py-2"} text-sm font-medium rounded-lg transition-colors flex items-center justify-center ${
                                currentPage === totalPages
                                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            <ChevronRight
                                className={`w-4 h-4 ${currentPage === totalPages ? "text-gray-400" : "text-gray-700"}`}
                            />
                        </button>
                    </div>

                    {/* 오른쪽 빈 공간 (데스크톱 균형용) */}
                    {!isMobileView && <div></div>}
                </div>

                {/* 모바일용 페이지 정보 (하단) */}
                {isMobileView && (
                    <div className="text-center mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                            총{" "}
                            <span className="font-medium text-gray-800">
                                {filteredList.length}
                            </span>
                            개 중{" "}
                            <span className="font-medium text-gray-800">
                                {startIndex + 1}
                            </span>
                            -
                            <span className="font-medium text-gray-800">
                                {Math.min(
                                    startIndex + itemsPerPage,
                                    filteredList.length
                                )}
                            </span>
                            개 표시
                            {loading && (
                                <div className="inline-flex items-center ml-2">
                                    <svg
                                        className="animate-spin h-3 w-3 text-indigo-500 mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    <span className="text-indigo-500 text-xs">
                                        로딩 중
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col w-full">
            {/* Header */}
            <AdminHeader path={"/manage"} />

            {/* 메인 컨테이너 */}
            <div className="flex-1 p-4 md:p-6">
                {/* 에러 메시지 */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-red-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    오류 발생!
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                                <div className="mt-4">
                                    <button
                                        onClick={fetchEvents}
                                        className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-lg transition-colors"
                                    >
                                        다시 시도
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 컨트롤 섹션 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* 제목과 카운트 */}
                        <div className="flex items-center justify-between gap-4 h-[4vh]">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    문화 행사 관리
                                </h1>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">
                                    총{" "}
                                    <span className="font-semibold text-indigo-600">
                                        {list.length}
                                    </span>
                                    개 중{" "}
                                    <span className="font-semibold text-indigo-600">
                                        {filteredList.length}
                                    </span>
                                    개 표시
                                    {loading && (
                                        <span className="inline-flex items-center ml-2">
                                            <svg
                                                className="animate-spin h-4 w-4 text-indigo-500 mr-1"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            <span className="text-indigo-500 text-sm">
                                                로딩 중
                                            </span>
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* 뷰 모드 토글 - 모바일에서는 숨김 */}
                        {!isMobileView && (
                            <div className="flex items-center gap-2 bg-white rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                                        viewMode === "grid"
                                            ? "bg-indigo-600 text-white shadow-md"
                                            : "bg-white text-gray-900 hover:text-indigo-600 shadow-sm border border-gray-200"
                                    }`}
                                >
                                    <Grid className="w-4 h-4" />
                                    그리드
                                </button>
                                <button
                                    onClick={() => setViewMode("table")}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                                        viewMode === "table"
                                            ? "bg-indigo-600 text-white shadow-md"
                                            : "bg-white text-gray-900 hover:text-indigo-600 shadow-sm border border-gray-200"
                                    }`}
                                >
                                    <Menu className="w-4 h-4" />
                                    테이블
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 필터 및 검색 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        {/* 카테고리 필터 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                카테고리
                            </label>
                            <select
                                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                value={filterCategory}
                                onChange={(e) =>
                                    setFilterCategory(e.target.value)
                                }
                            >
                                <option value="">전체 카테고리</option>
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 요금 유형 필터 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                요금 유형
                            </label>
                            <select
                                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                value={filterFeeType}
                                onChange={(e) =>
                                    setFilterFeeType(e.target.value)
                                }
                            >
                                <option value="">전체</option>
                                <option value="free">무료</option>
                                <option value="paid">유료</option>
                            </select>
                        </div>

                        {/* 검색 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                행사명 검색
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="행사 제목 검색..."
                                    className="w-full px-4 py-2 pl-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                                <svg
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* 액션 버튼들 */}
                        <div className="flex items-end gap-2">
                            <button
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                                onClick={() => {
                                    setFilterCategory("");
                                    setFilterFeeType("");
                                    setSearchTerm("");
                                }}
                            >
                                <svg
                                    className="w-4 h-4 mr-0 sm:mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                <span className="text-xs">초기화</span>
                            </button>
                            <button
                                className={`flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={fetchEvents}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg
                                            className="animate-spin w-4 h-4 mr-0 sm:mr-2"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        <span className="text-xs">
                                            새로고침
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="w-4 h-4 mr-0 sm:mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                        <span className="text-xs">
                                            새로고침
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 컨텐츠 영역 */}
                <div>
                    {loading && list.length === 0 ? (
                        <LoadingSkeleton />
                    ) : filteredList.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20.657a7.962 7.962 0 01-6-2.366"
                                />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {list.length > 0
                                    ? "검색 조건에 맞는 행사가 없습니다"
                                    : "등록된 문화 행사가 없습니다"}
                            </h3>
                            <p className="text-gray-500">
                                {list.length > 0
                                    ? "다른 검색 조건을 시도해보세요."
                                    : "새로운 문화 행사를 등록해보세요."}
                            </p>
                        </div>
                    ) : (
                        <>
                            {viewMode === "grid" || isMobileView ? (
                                <GridView />
                            ) : (
                                <TableView />
                            )}
                            <Pagination />
                        </>
                    )}
                </div>
            </div>

            {/* 요금 정보 모달 */}
            {selectedEvent && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 모달 헤더 */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">
                                        {selectedEvent.is_free
                                            ? "행사 상세 정보"
                                            : "요금 정보"}
                                    </h3>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/20 border border-white/30`}
                                    >
                                        {selectedEvent.category}
                                    </span>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                    aria-label="닫기"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* 모달 컨텐츠 */}
                        <div className="p-6">
                            <h4 className="text-xl font-bold text-gray-900 mb-4">
                                {selectedEvent.event_name}
                            </h4>

                            <div className="space-y-4">
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                    <svg
                                        className="w-5 h-5 text-gray-400 mr-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            장소
                                        </p>
                                        <p className="font-medium text-gray-900">
                                            {selectedEvent.gu}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                    <svg
                                        className="w-5 h-5 text-gray-400 mr-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            기간
                                        </p>
                                        <p className="font-medium text-gray-900">
                                            {formatDate(
                                                selectedEvent.start_date
                                            )}{" "}
                                            ~{" "}
                                            {formatDate(selectedEvent.end_date)}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                                    <div className="flex items-start">
                                        <svg
                                            className="w-5 h-5 text-indigo-600 mr-3 mt-0.5"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                            <path
                                                fillRule="evenodd"
                                                d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-indigo-900 mb-2">
                                                {selectedEvent.is_free
                                                    ? "참가비"
                                                    : "요금 정보"}
                                            </p>
                                            <div className="bg-white/70 p-3 rounded-lg">
                                                <p className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">
                                                    {selectedEvent.is_free
                                                        ? "무료 행사입니다"
                                                        : selectedEvent.event_fee ||
                                                          "상세한 요금 정보가 제공되지 않았습니다."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start">
                                        <svg
                                            className="w-5 h-5 text-amber-600 mr-3 mt-0.5"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-amber-900 mb-1">
                                                안내사항
                                            </p>
                                            <p className="text-xs text-amber-800">
                                                요금은 변동될 수 있으니 방문 전
                                                공식 사이트나 전화로 확인해
                                                주세요.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 모달 푸터 */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={closeModal}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                확인
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2">
                                ESC 키를 눌러서도 닫을 수 있습니다
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTour;

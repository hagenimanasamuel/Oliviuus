import React, { useState, useEffect, useCallback } from "react";
import api from "../../../../api/axios";
import GamesHeader from "../../../../components/layout/dashboard/admin/games/GamesHeader";
import GamesList from "../../../../components/layout/dashboard/admin/games/GamesList";
import GameForm from "../../../../components/layout/dashboard/admin/games/GameForm";

export default function AllGames() {
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [totalGames, setTotalGames] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isGameFormOpen, setIsGameFormOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const LIMIT = 15;

  // Fetch games function
  const fetchGames = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await api.get("/games/admin", {
        params: {
          limit: LIMIT,
          offset: reset ? 0 : offset,
          search,
          category: categoryFilter,
          is_active: statusFilter ? (statusFilter === "active" ? "true" : "false") : undefined,
          age_min: ageFilter?.split("-")[0],
          age_max: ageFilter?.split("-")[1],
          sort,
          created_start: dateRange.start,
          created_end: dateRange.end,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const fetchedGames = res.data?.games || [];
      const total = res.data?.total || fetchedGames.length;

      setGames(reset ? fetchedGames : [...games, ...fetchedGames]);
      setTotalGames(total);
      setHasMore(fetchedGames.length === LIMIT);
      setOffset(reset ? LIMIT : offset + fetchedGames.length);
    } catch (err) {
      console.error("Error fetching games:", err);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    categoryFilter,
    statusFilter,
    ageFilter,
    sort,
    dateRange,
    offset,
    games,
    loading,
  ]);

  // Fetch categories and skills
  const fetchCategoriesAndSkills = useCallback(async () => {
    try {
      // Fetch categories
      const categoriesRes = await api.get("/games/categories");
      setCategories(categoriesRes.data || []);

      // Fetch skills
      const skillsRes = await api.get("/educational-skills");
      setSkills(skillsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch categories/skills", error);
    }
  }, []);

  // Export games
  const handleExport = async () => {
    try {
      const res = await api.get("/games/admin/export", {
        params: {
          search,
          category: categoryFilter,
          status: statusFilter,
          sort,
          created_start: dateRange.start,
          created_end: dateRange.end,
        },
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `games_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exporting games:", err);
      alert("Failed to export games.");
    }
  };

  // Handle game actions
  const handleAddGame = () => {
    setSelectedGame(null);
    setIsGameFormOpen(true);
  };

  const handleEditGame = (gameId) => {
    const game = games.find(g => g.id === gameId);
    setSelectedGame(game);
    setIsGameFormOpen(true);
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm("Are you sure you want to delete this game?")) return;

    try {
      await api.delete(`/games/admin/${gameId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setGames(games.filter(g => g.id !== gameId));
      setTotalGames(prev => prev - 1);
    } catch (error) {
      console.error("Error deleting game:", error);
      alert("Failed to delete game");
    }
  };

  const handleViewGame = (gameId) => {
    // Navigate to game details or open preview
    const game = games.find(g => g.id === gameId);
    window.open(`/admin/games/preview/${gameId}`, '_blank');
  };

  const handleBulkAction = async (action) => {
    // Implement bulk actions
    console.log("Bulk action:", action);
  };

  const handleSaveGame = (savedGame) => {
    setIsGameFormOpen(false);
    if (selectedGame) {
      // Update existing game in list
      setGames(games.map(g => g.id === savedGame.id ? savedGame : g));
    } else {
      // Add new game to list
      setGames([savedGame, ...games]);
      setTotalGames(prev => prev + 1);
    }
  };

  const handleCloseGameForm = () => {
    setIsGameFormOpen(false);
    setSelectedGame(null);
  };

  // Fetch games on filter changes
  useEffect(() => {
    fetchGames(true);
  }, [search, categoryFilter, statusFilter, ageFilter, sort, dateRange.start, dateRange.end]);

  // Fetch categories and skills on mount
  useEffect(() => {
    fetchCategoriesAndSkills();
  }, [fetchCategoriesAndSkills]);

  return (
    <div className="w-full">
      <GamesHeader
        search={search}
        setSearch={setSearch}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        ageFilter={ageFilter}
        setAgeFilter={setAgeFilter}
        sort={sort}
        setSort={setSort}
        totalGames={totalGames}
        filteredCount={games.length}
        dateRange={dateRange}
        setDateRange={setDateRange}
        onAddGame={handleAddGame}
        onExport={handleExport}
        selectedGames={[]}
        onBulkAction={handleBulkAction}
        onRefresh={() => fetchGames(true)}
      />

      <GamesList
        games={games}
        loading={loading}
        hasMore={hasMore}
        loadMore={() => fetchGames()}
        onEdit={handleEditGame}
        onDelete={handleDeleteGame}
        onView={handleViewGame}
      />

      {/* Game Form Modal */}
      {isGameFormOpen && (
        <GameForm
          game={selectedGame}
          onClose={handleCloseGameForm}
          onSave={handleSaveGame}
          categories={categories}
          skills={skills}
        />
      )}
    </div>
  );
}
window.KevraFavorites = {
  get() {
    return KevraStorage.get("kevra_favorites");
  },

  save(data) {
    KevraStorage.set("kevra_favorites", data);
  }
};
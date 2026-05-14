window.KevraCart = {
  get() {
    return KevraStorage.get("kevra_cart");
  },

  save(data) {
    KevraStorage.set("kevra_cart", data);
  }
};
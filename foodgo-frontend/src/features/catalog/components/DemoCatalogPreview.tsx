import {M01Screen as Screen,SearchBar} from "./M01Layout";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Banner, Button, Chip, Empty, Heading, Label } from "../../../shared/components/ui";
import { FoodThumbnail } from "../../../shared/components/FoodThumbnail";
import { colors, money } from "../../../shared/theme/theme";
import { FoodCard, RestaurantCard } from "./FoodCards";
import { previewCategories, previewFoods, previewRestaurantName, previewRestaurants } from "../catalogPreview";
import { filterPreviewFoods, filterPreviewRestaurants } from "../catalogPreviewQuery";
import { previewOptionsFor, previewUnitPrice } from "../catalogPreviewOptions";

/** Explicit read-only UI preview; no fake API response or cart writes. */
export function DemoDiscoveryHome() {
  return (
    <View style={{ gap: 14 }}>
      <Heading>Hôm nay ăn gì?</Heading>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {previewCategories.map((category) => (
          <Chip key={category.id} title={category.name} selected={false} onPress={() => router.push((category.id === "all" ? "/catalog" : `/catalog?categoryId=${category.id}`) as Href)} />
        ))}
      </ScrollView>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Heading>Món nổi bật</Heading>
        <Button title="Xem tất cả" variant="ghost" onPress={() => router.push("/catalog" as Href)} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {previewFoods.slice(0, 6).map((food) => (
          <FoodCard key={food.id} food={food} restaurantName={previewRestaurantName(food.restaurantId)} horizontal onPress={() => router.push(`/food/${food.id}` as Href)} />
        ))}
      </ScrollView>
      <Heading>Quán gợi ý</Heading>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {previewRestaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} horizontal onPress={() => router.push(`/restaurants/${restaurant.id}` as Href)} />)}
      </ScrollView>
      <Banner>Bạn đang xem món minh họa. Về trang chủ và chọn giỏ mẫu để thử đặt món nhé.</Banner>
    </View>
  );
}

export function DemoCatalogScreen() {
  const params = useLocalSearchParams<{ categoryId?: string; restaurantId?: string; q?: string }>();
  const [text, setText] = useState(typeof params.q === "string" ? params.q : "");
  const [query, setQuery] = useState(typeof params.q === "string" ? params.q : "");
  const [type, setType] = useState<"FOOD" | "RESTAURANT">("FOOD");
  const [category, setCategory] = useState(typeof params.categoryId === "string" ? params.categoryId : "all");
  const [sort, setSort] = useState<"rating" | "price">("rating");
  const restaurantId = typeof params.restaurantId === "string" ? params.restaurantId : "";
  const foods = useMemo(() => filterPreviewFoods({ q: query, categoryId: category, restaurantId, sort }), [category, restaurantId, query, sort]);
  const restaurants = useMemo(() => filterPreviewRestaurants(query), [query]);
  return (
    <Screen title="Khám phá món ăn" back>

      <SearchBar value={text} onChangeText={value=>{setText(value);setQuery(value);}} onSubmitEditing={() => setQuery(text)} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip title="Món ăn" selected={type === "FOOD"} onPress={() => setType("FOOD")} />
        <Chip title="Nhà hàng" selected={type === "RESTAURANT"} onPress={() => setType("RESTAURANT")} />
      </View>
      {type === "FOOD" ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: "center" }}>
            {previewCategories.map((c) => <Chip key={c.id} title={c.name} selected={category === c.id} onPress={() => setCategory(c.id)} />)}
          </ScrollView>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Chip title="Gợi ý" selected={sort === "rating"} onPress={() => setSort("rating")} />
            <Chip title="Giá tăng dần" selected={sort === "price"} onPress={() => setSort("price")} />
          </View>
          <Heading>{foods.length} món minh họa</Heading>
          {foods.map((food) => <FoodCard key={food.id} food={food} restaurantName={previewRestaurantName(food.restaurantId)} onPress={() => router.push(`/food/${food.id}` as Href)} />)}
          {!foods.length && <Empty title="Chưa tìm thấy món" detail="Thử từ khóa hoặc danh mục khác." />}
        </>
      ) : (
        <>
          <Heading>{restaurants.length} quán mẫu</Heading>
          {restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} onPress={() => router.push(`/restaurants/${restaurant.id}` as Href)} />)}
          {!restaurants.length && <Empty title="Không tìm thấy quán" detail="Thử tìm tên khác." />}
        </>
      )}
      <Label muted>Không ghi giỏ, yêu thích hoặc đơn hàng trong danh sách minh họa.</Label>
    </Screen>
  );
}

export function DemoRestaurantScreen() {
  const {width}=useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurant = previewRestaurants.find((item) => item.id === id);
  if (!restaurant) return <Screen title="Không tìm thấy quán" back><Empty title="Không có dữ liệu xem trước" /></Screen>;
  const menu = previewFoods.filter((food) => food.restaurantId === id);
  return (
    <Screen title={restaurant.name} back subtitle="Nhà hàng minh họa">
      <View style={{ alignItems: "center" }}><FoodThumbnail imageCode={restaurant.imageCode} name={restaurant.name} width={Math.max(240,width-32)} height={190} /></View>
      <Label>{restaurant.addressText}</Label>
      <Label muted>{restaurant.sampleRating} ★ · {(restaurant.sampleDistanceM / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} km · {restaurant.sampleEtaMinutes} phút · Thông tin minh họa</Label>
      <Heading>Thực đơn ({menu.length} món)</Heading>
      {menu.map((food) => <FoodCard key={food.id} food={food} restaurantName={restaurant.name} onPress={() => router.push(`/food/${food.id}` as Href)} />)}
      <Banner>Thực đơn minh họa để bạn khám phá. Các món này chưa thể thêm vào giỏ.</Banner>
    </Screen>
  );
}

export function DemoFoodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const food = previewFoods.find((item) => item.id === id);
  if (!food) return <Screen title="Không tìm thấy món" back><Empty title="Không có dữ liệu xem trước" /></Screen>;
  // A key isolates the choice state if the router reuses a component for another food ID.
  return <DemoFoodChoice key={food.id} food={food} />;
}

function DemoFoodChoice({ food }: { food: (typeof previewFoods)[number] }) {
  const {width}=useWindowDimensions();
  const options = previewOptionsFor(food);
  const [sizeId, setSizeId] = useState(options.sizes[0].id);
  const [extraId, setExtraId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const unitPrice = previewUnitPrice(food, sizeId, extraId);
  return (
    <Screen title={food.name} back subtitle={`${previewRestaurantName(food.restaurantId)} · Món mẫu`}>
      <View style={{ alignItems: "center" }}><FoodThumbnail name={food.name} imageCode={food.imageCode} width={Math.max(240,width-32)} height={210} /></View>
      <Label muted>Ảnh và thông tin món mang tính minh họa</Label>
      <Label>{food.description}</Label>
      <Heading>{money(food.basePrice)}</Heading>
      <Heading>{options.sizeTitle}</Heading>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {options.sizes.map((option) => <Chip key={option.id} title={option.label} selected={sizeId === option.id} onPress={() => setSizeId(option.id)} />)}
      </View>
      <Heading>{options.extraTitle}</Heading>
      {options.extras.map((option) => <Chip key={option.id} title={option.label} selected={extraId === option.id} onPress={() => setExtraId((current) => current === option.id ? null : option.id)} />)}
      <Heading>Số lượng</Heading>
      <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
        <Button title="−" disabled={quantity <= 1} variant="secondary" onPress={() => setQuantity((value) => Math.max(1, value - 1))} />
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>{quantity}</Text>
        <Button title="+" disabled={quantity >= 99} variant="secondary" onPress={() => setQuantity((value) => Math.min(99, value + 1))} />
      </View>
      <Heading>Tạm tính: {money(unitPrice * quantity)}</Heading>
      <Banner>Giá và tùy chọn ở đây chỉ để dùng thử. Món này chưa được thêm vào giỏ.</Banner>
      <Button title="Về trang chủ để thử giỏ mẫu" onPress={() => router.push("/" as Href)} />
    </Screen>
  );
}

package com.orbit.entity.procurement;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("GOODS")
@Getter
@Setter
public class GoodsRequest extends PurchaseRequest {

    @OneToMany(mappedBy = "goodsRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseRequestItem> items = new ArrayList<>(); // 타입 명시

    // GoodsRequest.java
    public void addItem(PurchaseRequestItem item) {
        items.add(item);
        item.setGoodsRequest(this); // 양방향 연관 관계 설정
    }

    public void removeItem(PurchaseRequestItem item) {
        items.remove(item);
        item.setGoodsRequest(null);
    }
}
package com.orbit.entity.procurement;

import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.entity.procurement.PurchaseRequestItem;
import jakarta.persistence.CascadeType;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@DiscriminatorValue("GOODS")
@Getter
@Setter
public class GoodsRequest extends PurchaseRequest {

    @OneToMany(mappedBy = "goodsRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseRequestItem> items = new ArrayList<>(); // 타입 명시

    public void addItem(PurchaseRequestItem item) {
        items.add(item);
        item.setGoodsRequest(this);
    }

    public void removeItem(PurchaseRequestItem item) {
        items.remove(item);
        item.setGoodsRequest(null);
    }
}

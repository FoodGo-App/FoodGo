import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Chip, Field, Heading, Label, Panda } from '../../../shared/components/ui';
import { GuiModal, Icon, guiStyles } from '../../../shared/components/Gui';
import { IllustratedMap } from '../../../shared/components/IllustratedMap';
import { MotionPressable } from '../../../shared/components/Motion';
import { colors, money } from '../../../shared/theme/theme';
import type { Address, Offer, PaymentMethod, Quote } from '../../../shared/types/domain';
import { offerGroups } from '../offerSelection';
import { offerProblem } from '../checkoutFlow';
import { useApp } from '../../../providers/AppProvider';
import { addressService, blankAddress, validateAddress, type AddressInput } from '../../account/addressService';
import { useDraft } from '../../../shared/hooks/useDraft';
import { useWriteAction } from '../../../shared/hooks/useWriteAction';

export function SelectionRow({ title, detail, selected, disabled, onPress, icon = 'ticket' }: { title: string; detail?: string; selected?: boolean; disabled?: boolean; onPress: () => void; icon?: 'ticket' | 'wallet' | 'pin' }) {
  return <MotionPressable accessibilityRole="radio" accessibilityLabel={[title, detail].filter(Boolean).join('. ')} accessibilityState={{ selected: !!selected, disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[chooserStyles.option, selected && chooserStyles.selected, disabled && { opacity: 0.5 }]}>
    <Icon name={icon} size={30} /><View style={{ flex: 1, gap: 4 }}><Text style={guiStyles.heading}>{title}</Text>{detail && <Text style={guiStyles.muted}>{detail}</Text>}</View>
    <View style={[chooserStyles.radio, selected && { borderColor: colors.brand }]}>{selected && <View style={chooserStyles.dot} />}</View>
  </MotionPressable>;
}

export function OfferChooser({ visible, onClose, offers, selectedId, subtotal, method, restaurantId, editable, onSelect, quote, updating, error, onRetry }: { visible: boolean; onClose: () => void; offers: Offer[]; selectedId: string; subtotal: number; method: PaymentMethod; restaurantId: string; editable: boolean; onSelect: (id: string) => void; quote: Quote | null; updating: boolean; error?: string | null; onRetry: () => void }) {
  const [search, setSearch] = useState(''), [expanded, setExpanded] = useState(false);
  const groups = offerGroups(offers, search, subtotal, method, restaurantId);
  const renderOffer = (offer: Offer) => { const reason = offerProblem(offer, subtotal, method, restaurantId); return <SelectionRow key={offer.id} title={offer.code} detail={`${offer.name} · ${reason || `Đơn từ ${money(offer.minSubtotal)}`}`} selected={selectedId === offer.id && !reason} disabled={!editable || !!reason} onPress={() => onSelect(offer.id)} />; };
  return <GuiModal visible={visible} title="Chọn ưu đãi" onClose={onClose} footer={<>
    <View style={guiStyles.between}><View><Label muted>Tiết kiệm</Label><Text style={chooserStyles.saving}>{quote ? money(quote.foodDiscount + quote.deliveryDiscount) : '—'}</Text></View><View><Label muted>Tổng mới</Label><Text accessibilityLiveRegion="polite" style={chooserStyles.total}>{quote ? money(quote.total) : updating ? 'Đang tính…' : 'Chưa có giá'}</Text></View></View>
    <Button title="Xong" onPress={onClose} />
  </>}>
    <Field label="Tìm mã ưu đãi" placeholder="Nhập mã hoặc tên ưu đãi" value={search} onChangeText={setSearch} autoCapitalize="characters" />
    <Heading>Dành cho đơn này</Heading>
    <SelectionRow title="Không dùng ưu đãi" selected={!selectedId} disabled={!editable} onPress={() => onSelect('')} />
    {groups.available.map(renderOffer)}
    {!groups.available.length && <Label muted>Không tìm thấy ưu đãi phù hợp.</Label>}
    {!!groups.unavailable.length && <><Button title={`Ưu đãi chưa dùng được (${groups.unavailable.length})${expanded ? ' · Thu gọn' : ''}`} variant="secondary" onPress={() => setExpanded(v => !v)} />{expanded && groups.unavailable.map(renderOffer)}</>}
    <View style={[guiStyles.row, { justifyContent: 'center' }]}><Panda size={100} pose="hello" decorative /><Label muted>Một mã cho mỗi đơn</Label></View>
    {error && <><Banner error>{error}</Banner><Button title="Thử cập nhật giá lại" variant="secondary" onPress={onRetry} /></>}
  </GuiModal>;
}

export function AddressChooser({ visible, onClose, addresses, selectedId, onSelect, editable, allowEdit, onSaved }: { visible: boolean; onClose: () => void; addresses: Address[]; selectedId: string; onSelect: (id: string) => void; editable: boolean; allowEdit: boolean; onSaved: (id: string) => Promise<void> }) {
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const selected = addresses.find(a => a.id === selectedId);
  return <GuiModal visible={visible} title={editing ? editing === 'new' ? 'Thêm địa chỉ' : 'Sửa địa chỉ' : 'Chọn địa chỉ'} onClose={() => editing ? setEditing(null) : onClose()} footer={!editing && <Button title="Xác nhận địa chỉ" disabled={!selected || !editable} onPress={onClose} />}>
    {editing ? <AddressEditor key={editing === 'new' ? 'new' : editing.id} address={editing === 'new' ? undefined : editing} onSaved={async id => { await onSaved(id); setEditing(null); }} /> : <>
      <View style={{ marginHorizontal: -20, marginTop: -18 }}><IllustratedMap addressText={selected?.addressText} pointCode={selected?.mapPointCode} height={340} /></View>
      <Heading>Giao đến đây</Heading>
      {selected && <><Text style={guiStyles.heading}>{selected.addressText}</Text><View style={guiStyles.row}><Icon name="person" /><Label>{selected.recipientName} · {selected.recipientPhone}</Label></View></>}
      <Label muted>Địa chỉ đã lưu · Khu vực và ghim minh họa, không phải GPS.</Label>
      {addresses.map(a => <SelectionRow key={a.id} icon="pin" title={a.label} detail={`${a.recipientName} · ${a.addressText}`} selected={selectedId === a.id} disabled={!editable} onPress={() => onSelect(a.id)} />)}
      {!addresses.length && <Banner>Thêm địa chỉ nhận món để tiếp tục nhé.</Banner>}
      {allowEdit && <View style={guiStyles.row}>{selected && <View style={{ flex: 1 }}><Button title="Sửa địa chỉ" variant="secondary" disabled={!editable} onPress={() => setEditing(selected)} /></View>}<View style={{ flex: 1 }}><Button title="Thêm địa chỉ" variant="secondary" disabled={!editable || addresses.length >= 10} onPress={() => setEditing('new')} /></View></View>}
    </>}
  </GuiModal>;
}

function AddressEditor({ address, onSaved }: { address?: Address; onSaved: (id: string) => Promise<void> }) {
  const { request } = useApp();
  const draft = useDraft<AddressInput>('address', address?.id ?? 'new', address ?? blankAddress), write = useWriteAction();
  const [validation, setValidation] = useState<string | null>(null), [saved, setSaved] = useState<Address | null>(null);
  const value = draft.value;
  return <View style={{ gap: 16 }}>
    {([['recipientName', 'Người nhận'], ['recipientPhone', 'Số điện thoại'], ['addressText', 'Địa chỉ'], ['label', 'Nhãn địa chỉ']] as const).map(([key, label]) => <Field key={key} label={label} value={value[key]} editable={draft.ready && !write.busy && !saved} keyboardType={key === 'recipientPhone' ? 'phone-pad' : 'default'} onChangeText={text => { void draft.update({ ...value, [key]: text }).catch(() => {}); }} />)}
    <Label>Điểm nhận trong khu vực mẫu</Label>
    {['CUSTOMER_A', 'CUSTOMER_B'].map((point, index) => <Chip key={point} title={`Điểm nhận ${index + 1}`} selected={value.mapPointCode === point} disabled={!draft.ready || write.busy || !!saved} onPress={() => { void draft.update({ ...value, areaCode: 'AREA_A', mapPointCode: point }).catch(() => {}); }} />)}
    <Label muted>Ghim mẫu dùng cho bản đồ minh họa. Địa chỉ không được định vị tự động.</Label>
    {(validation || write.error || draft.error) && <Banner error>{validation || write.error || draft.error}</Banner>}
    {!draft.ready && draft.error && <Button title="Tải lại bản nháp" onPress={() => { void draft.reload(); }} />}
    {write.uncertain && <Button title="Đọc lại danh sách địa chỉ" onPress={() => { void write.run(async () => { await addressService(request).list(); }, write.reconciled); }} />}
    {saved ? <><Banner>Địa chỉ đã lưu. Đọc lại thông tin đơn để tiếp tục.</Banner><Button title="Đọc lại thông tin đơn" onPress={() => { void write.run(() => onSaved(saved.id)); }} /></> : <Button title="Lưu địa chỉ" busy={write.busy} disabled={!draft.ready || write.uncertain} onPress={() => {
      const problem = validateAddress(value); setValidation(problem); if (problem) return;
      void write.run(async () => {
        const result = await addressService(request).save({ ...value, recipientName: value.recipientName.trim(), addressText: value.addressText.trim(), label: value.label.trim() }, address?.id);
        setSaved(result);
        if (!address) await draft.update(blankAddress).catch(() => {});
        await onSaved(result.id);
      });
    }} />}
  </View>;
}

const chooserStyles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 17, minHeight: 94, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  selected: { borderColor: colors.brand, borderWidth: 2, backgroundColor: colors.mint },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.brand },
  saving: { fontSize: 23, fontWeight: '800', color: colors.brand }, total: { fontSize: 23, fontWeight: '800', color: colors.ink },
});

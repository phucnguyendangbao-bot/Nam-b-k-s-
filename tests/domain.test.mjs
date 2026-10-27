import test from 'node:test';
import assert from 'node:assert/strict';
import {fold,similarity,safeUrl,mapEmbed} from '../lib/catalog.ts';
import {canEdit,canReview,canAdmin,rightsCanStore,validCoordinates} from '../lib/policy.ts';
test('roles separate research, publication and administration',()=>{
  assert.equal(canEdit('researcher'),true);assert.equal(canReview('researcher'),false);
  assert.equal(canReview('editor'),true);assert.equal(canAdmin('editor'),false);
  for(const role of ['visitor','contributor','unknown','']){assert.equal(canEdit(role),false);assert.equal(canReview(role),false);assert.equal(canAdmin(role),false);}
});
test('Vietnamese lookup normalizes accents without changing stored titles',()=>{
  assert.equal(fold('  Đờn ca TÀI TỬ  '),'don ca tai tu');assert.equal(similarity('Đầu Sấu','dau sau'),1);
  assert.ok(similarity('Nhơn Ái','nhon ai')>.9);assert.ok(similarity('Bậu','nghe thuat')<.52);
});
test('copyrighted body cannot be stored without explicit storage permission',()=>{
  assert.equal(rightsCanStore('Nội dung',false),false);assert.equal(rightsCanStore('',false),true);assert.equal(rightsCanStore('Nội dung',true),true);
});
test('external source links reject script schemes and embedded credentials',()=>{
  for(const url of ['javascript:alert(1)','data:text/html,test','https://user:pass@example.org','//example.org','http://example.org'])assert.equal(safeUrl(url),null);
  assert.equal(safeUrl('https://example.org/source'),'https://example.org/source');
});
test('geography accepts missing pairs and rejects incomplete/nonfinite/out-of-range coordinates',()=>{
  assert.equal(validCoordinates(null,null),true);assert.equal(validCoordinates(10,null),false);assert.equal(validCoordinates(100,105),false);
  assert.equal(validCoordinates(NaN,105),false);assert.equal(validCoordinates(10,Infinity),false);assert.equal(validCoordinates(10,105),true);
  assert.ok(mapEmbed(10,105).includes('marker=10%2C105'));assert.ok(!mapEmbed().includes('marker='));
});

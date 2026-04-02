import { useState, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { productsApi, uploadApi } from '../lib/api';

/**
 * 分类接口
 */
export interface Category {
  id: string;
  name: string;
  children?: Category[];
}

/**
 * 商品规格接口
 */
export interface ProductSpec {
  id: number;
  name: string;
  price: string;
  original_price: string;
  stock: string;
}

/**
 * 商品表单数据接口
 */
export interface ProductFormData {
  name: string;
  category_id: string;
  brand: string;
  description: string;
  price: string;
  original_price: string;
  stock: string;
  status: string;
}

/**
 * 商品表单 Hook
 * 提取商品添加/编辑页面的公共逻辑
 */
export function useProductForm() {
  const toast = useToast();

  // 分类数据
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);

  // 图片数据
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // 规格数据
  const [isMultiSpec, setIsMultiSpec] = useState(false);
  const [specs, setSpecs] = useState<ProductSpec[]>([
    { id: 1, name: '', price: '', original_price: '', stock: '' }
  ]);

  // 获取分类列表
  const fetchCategories = useCallback(async () => {
    setCategoryLoading(true);
    try {
      const res = await productsApi.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error('Get categories error:', error);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  // 图片上传处理
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 验证文件类型
    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        toast.error(`${file.name} 不是有效的图片文件`);
      }
      return isImage;
    });

    if (validFiles.length === 0) return;

    // 检查总数量限制
    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      toast.error('最多上传 5 张图片');
      return;
    }

    const filesToUpload = validFiles.slice(0, remainingSlots);
    setUploadingImages(true);

    try {
      const res = await uploadApi.uploadImages(filesToUpload);
      if (res.success && res.data) {
        setImages(prev => [...prev, ...res.data!.urls]);
        if (res.data.errors && res.data.errors.length > 0) {
          res.data.errors.forEach(err => {
            toast.error(`图片 ${err.index + 1}: ${err.message}`);
          });
        }
      } else {
        toast.error(res.error?.message || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('上传图片失败');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  }, [images.length, toast]);

  // 删除图片
  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 添加规格
  const addSpec = useCallback(() => {
    setSpecs(prev => [...prev, { id: Date.now(), name: '', price: '', original_price: '', stock: '' }]);
  }, []);

  // 删除规格
  const removeSpec = useCallback((id: number) => {
    if (specs.length > 1) {
      setSpecs(prev => prev.filter(s => s.id !== id));
    }
  }, [specs.length]);

  // 更新规格字段
  const updateSpec = useCallback((id: number, field: string, value: string) => {
    setSpecs(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  // 验证表单基础字段
  const validateBasicFields = useCallback((formData: ProductFormData): boolean => {
    if (!formData.name.trim()) {
      toast.error('请输入商品名称');
      return false;
    }
    if (!formData.category_id) {
      toast.error('请选择商品分类');
      return false;
    }
    return true;
  }, [toast]);

  // 验证单规格字段
  const validateSingleSpec = useCallback((formData: ProductFormData): boolean => {
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('请输入正确的销售价');
      return false;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      toast.error('请输入正确的库存数量');
      return false;
    }
    return true;
  }, [toast]);

  // 验证多规格
  const validateMultiSpec = useCallback(() => {
    const validSpecs = specs.filter(s => s.name && s.price && s.stock);
    if (validSpecs.length === 0) {
      toast.error('请至少添加一个完整的规格');
      return false;
    }
    return true;
  }, [specs, toast]);

  // 综合验证
  const validateForm = useCallback((formData: ProductFormData): boolean => {
    if (!validateBasicFields(formData)) return false;
    if (isMultiSpec) {
      return validateMultiSpec();
    } else {
      return validateSingleSpec(formData);
    }
  }, [isMultiSpec, validateBasicFields, validateSingleSpec, validateMultiSpec]);

  // 重置规格
  const resetSpecs = useCallback(() => {
    setSpecs([{ id: 1, name: '', price: '', original_price: '', stock: '' }]);
    setIsMultiSpec(false);
  }, []);

  // 设置初始图片
  const setInitialImages = useCallback((imgs: string[]) => {
    setImages(imgs);
  }, []);

  // 设置初始规格
  const setInitialSpecs = useCallback((specList: ProductSpec[]) => {
    setSpecs(specList);
    setIsMultiSpec(specList.length > 0);
  }, []);

  return {
    // 分类
    categories,
    categoryLoading,
    fetchCategories,

    // 图片
    images,
    uploadingImages,
    handleImageUpload,
    removeImage,
    setInitialImages,

    // 规格
    specs,
    isMultiSpec,
    setIsMultiSpec,
    addSpec,
    removeSpec,
    updateSpec,
    resetSpecs,
    setInitialSpecs,

    // 验证
    validateForm,
    validateBasicFields,
    validateSingleSpec,
    validateMultiSpec,

    // Toast (供外部使用)
    toast
  };
}